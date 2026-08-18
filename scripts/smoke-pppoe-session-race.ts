import { strict as assert } from 'node:assert';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Client } from 'ssh2';

import {
  EstadoAccesoInternet,
  EstadoCuentaPppoe,
  EstadoOperacionPppoe,
  MetodoAutenticacionInternet,
} from '@prisma/client';

import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { MikroTikModule } from 'src/mikro-tik/mikro-tik.module';
import {
  MIKROTIK_ROUTER_CONNECTION_CONTEXT,
} from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import { MikrotikRouterConnectionContextPort } from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';

import { MikrotikSshModule } from 'src/modules/mikrotik-ssh/mikrotik-ssh.module';
import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';
import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';
import { MetodoAutenticacionMikrotikSsh } from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';
import { MikrotikPppoeCommandBuilder } from 'src/modules/mikrotik-ssh/infra/routeros/mikrotik-pppoe-command.builder';
import { RouterOsValueEscaper } from 'src/modules/mikrotik-ssh/infra/routeros/routeros-value-escaper';

/**
 * Smoke REAL enfocado exclusivamente en la condición de carrera de:
 *
 * /ppp active remove [find name="..."]
 *
 * A diferencia del smoke de orquestación, este script NO suspende la
 * cuenta en CRM ni deshabilita el secret. Mantiene el secret habilitado,
 * espera a que exista una sesión PPPoE real y elimina únicamente esa
 * sesión mediante MikrotikSshSession.removerSesionActiva().
 *
 * El CPE debe reconectarse después de cada remoción porque el secret
 * continúa habilitado. Esto permite repetir el escenario varias veces.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MikroTikModule,
    MikrotikSshModule,
  ],
})
class PppoeSessionRaceSmokeModule {}

type SmokeConfig = {
  clientId: number;
  expectedRouterId: number;
  cycles: number;
  activeWaitTimeoutMs: number;
  activePollIntervalMs: number;
  postActiveSettleMs: number;
};

type Target = {
  empresaId: number;
  clientId: number;
  accessId: number;
  accountId: number;
  pppoeUser: string;
  profileId: number;
  profileCode: string;
  routerId: number;
  routerName: string;
};

type RouterConnection = {
  routerId: number;
  host: string;
  port: number;
  username: string;
  password: string;
};

type ActiveProbeResult = {
  count: number;
  polls: number;
  waitMs: number;
};

type CycleMetric = {
  ciclo: number;
  esperaSesionActivaMs: number;
  pollsHastaSesionActiva: number;
  sesionesEncontradasBefore: number;
  sesionesRemovidas: number;
  sesionesRestantes: number;
  confirmacionIntentos: number;
  confirmacionDuracionMs: number;
  remocionTotalMs: number;
  esperaReconexionMs: number;
  pollsHastaReconexion: number;
};

const SAFETY_VALUE = 'YES_REAL_PPPOE_SESSION_RACE';
const SCRIPT_NAME = 'smoke-pppoe-session-race/1.0';

async function main(): Promise<void> {
  assertSafetySwitch();

  const config = readConfig();
  printHeader(config);

  const app = await NestFactory.createApplicationContext(
    PppoeSessionRaceSmokeModule,
    {
      logger: ['error', 'warn'],
    },
  );

  const prisma = app.get(PrismaService);
  const mikrotikSsh = app.get<MikrotikSshPort>(MIKROTIK_SSH_PORT, {
    strict: false,
  });
  const routerContext = app.get<MikrotikRouterConnectionContextPort>(
    MIKROTIK_ROUTER_CONNECTION_CONTEXT,
    { strict: false },
  );

  let probeClient: Client | null = null;

  try {
    const target = await resolveAndValidateTarget(prisma, config);
    printTarget(target);

    await assertNoRunningOperation(prisma, target);
    await assertLocalStateStillActive(prisma, target);

    const router = await routerContext.resolve(target.routerId);

    const connection: RouterConnection = {
      routerId: router.routerId,
      host: router.host,
      port: router.port,
      username: router.username,
      password: router.password,
    };

    probeClient = await openReadOnlyProbe(connection);

    const commandBuilder = new MikrotikPppoeCommandBuilder(
      new RouterOsValueEscaper(),
    );

    const activeProbeCommand = commandBuilder.construirBuscarSesionesActivas({
      usuarioPppoe: target.pppoeUser,
    }).comando;

    console.log('\nValidaciones previas: OK.');
    console.log(
      'Este smoke no cambia el estado CRM y no deshabilita/elimina el secret.',
    );
    console.log(
      'Únicamente remueve la sesión PPPoE real y espera que el CPE vuelva a conectar.\n',
    );

    const metrics: CycleMetric[] = [];

    for (let cycle = 1; cycle <= config.cycles; cycle += 1) {
      console.log('============================================================');
      console.log(`CICLO ${cycle}/${config.cycles}`);
      console.log('============================================================');

      await assertNoRunningOperation(prisma, target);
      await assertLocalStateStillActive(prisma, target);

      const beforeProbe = await waitForActiveSession({
        client: probeClient,
        command: activeProbeCommand,
        timeoutMs: config.activeWaitTimeoutMs,
        intervalMs: config.activePollIntervalMs,
        label: cycle === 1 ? 'sesión inicial' : 'reconexión previa al ciclo',
      });

      console.log(
        `Sesión PPPoE observada | count=${beforeProbe.count} | ` +
          `polls=${beforeProbe.polls} | espera=${beforeProbe.waitMs} ms`,
      );

      if (config.postActiveSettleMs > 0) {
        console.log(
          `Esperando ${config.postActiveSettleMs} ms después de detectar la sesión...`,
        );
        await delay(config.postActiveSettleMs);
      }

      let session: MikrotikSshSessionPort | null = null;
      let removalStartedAt = 0;

      try {
        session = await mikrotikSsh.abrirSesion({
          host: connection.host,
          port: connection.port,
          username: connection.username,
          autenticacion: {
            metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,
            password: connection.password,
          },
          verificacionHost: {
            verificar: false,
          },
        });

        const secret = await session.buscarSecret({
          usuarioPppoe: target.pppoeUser,
        });

        assert.equal(
          secret.encontrado,
          true,
          `El secret ${target.pppoeUser} dejó de existir durante el smoke.`,
        );
        assert.ok(secret.secret, 'El snapshot del secret no está disponible.');
        assert.equal(
          secret.secret.codigoPerfil,
          target.profileCode,
          'El perfil remoto dejó de coincidir con la homologación.',
        );
        assert.equal(
          secret.secret.deshabilitado,
          false,
          'El secret está deshabilitado. Este smoke exige una cuenta remota habilitada.',
        );

        removalStartedAt = Date.now();

        const result = await session.removerSesionActiva({
          usuarioPppoe: target.pppoeUser,
        });

        const removalTotalMs = Date.now() - removalStartedAt;

        assert.equal(
          result.sesionesRestantes,
          0,
          `El ciclo ${cycle} terminó con sesiones restantes.`,
        );
        assert.ok(
          result.confirmacionIntentos >= 1,
          'confirmacionIntentos debe ser >= 1.',
        );
        assert.ok(
          result.confirmacionDuracionMs >= 0,
          'confirmacionDuracionMs debe ser >= 0.',
        );

        console.log(
          `Remoción OK | BEFORE=${result.sesionesEncontradas} | ` +
            `removidas=${result.sesionesRemovidas} | restantes=${result.sesionesRestantes} | ` +
            `confirmación=${result.confirmacionIntentos} intento(s), ` +
            `${result.confirmacionDuracionMs} ms | total=${removalTotalMs} ms`,
        );

        if (result.sesionesEncontradas === 0) {
          console.warn(
            'AVISO: el probe observó una sesión activa, pero el BEFORE interno ya vio 0. ' +
              'La sesión desapareció entre ambas observaciones; este ciclo no ejercitó la mutación sobre una sesión presente.',
          );
        }

        const reconnectProbe = await waitForActiveSession({
          client: probeClient,
          command: activeProbeCommand,
          timeoutMs: config.activeWaitTimeoutMs,
          intervalMs: config.activePollIntervalMs,
          label: 'reconexión posterior a la remoción',
        });

        console.log(
          `CPE reconectado | polls=${reconnectProbe.polls} | espera=${reconnectProbe.waitMs} ms`,
        );

        metrics.push({
          ciclo: cycle,
          esperaSesionActivaMs: beforeProbe.waitMs,
          pollsHastaSesionActiva: beforeProbe.polls,
          sesionesEncontradasBefore: result.sesionesEncontradas,
          sesionesRemovidas: result.sesionesRemovidas,
          sesionesRestantes: result.sesionesRestantes,
          confirmacionIntentos: result.confirmacionIntentos,
          confirmacionDuracionMs: result.confirmacionDuracionMs,
          remocionTotalMs: removalTotalMs,
          esperaReconexionMs: reconnectProbe.waitMs,
          pollsHastaReconexion: reconnectProbe.polls,
        });
      } finally {
        if (session) {
          try {
            await session.cerrar();
          } catch {
            // El resultado remoto ya fue validado antes del cierre.
          }
        }
      }

      await assertLocalStateStillActive(prisma, target);
      console.log('');
    }

    await assertLocalStateStillActive(prisma, target);

    printSummary(metrics);

    console.log('\nSMOKE DE SESSION RACE COMPLETADO CORRECTAMENTE.');
    console.log('CRM permaneció ACTIVO y el secret nunca fue deshabilitado.');
  } catch (error: unknown) {
    process.exitCode = 1;
    console.error('\nSMOKE DE SESSION RACE FALLÓ.');
    printError(error);
  } finally {
    if (probeClient) {
      probeClient.end();
    }

    await app.close();
  }
}

async function resolveAndValidateTarget(
  prisma: PrismaService,
  config: SmokeConfig,
): Promise<Target> {
  const client = await prisma.clienteInternet.findUnique({
    where: {
      id: config.clientId,
    },
    select: {
      id: true,
      empresaId: true,
      isEliminado: true,
      accesosInternet: {
        select: {
          id: true,
          empresaId: true,
          metodoAutenticacion: true,
          estado: true,
          cuentaPppoe: {
            select: {
              id: true,
              empresaId: true,
              usuario: true,
              estado: true,
              perfilHomologacionId: true,
              perfilHomologacion: {
                select: {
                  id: true,
                  empresaId: true,
                  mikrotikRouterId: true,
                  codigoPerfil: true,
                  activo: true,
                },
              },
            },
          },
        },
      },
    },
  });

  assert.ok(client, `No existe ClienteInternet.id=${config.clientId}.`);
  assert.equal(
    client.isEliminado,
    false,
    `El cliente ${config.clientId} está eliminado.`,
  );

  const candidates = client.accesosInternet.filter((access) => {
    const account = access.cuentaPppoe;

    if (access.metodoAutenticacion !== MetodoAutenticacionInternet.PPPOE) {
      return false;
    }

    if (!account) {
      return false;
    }

    if (
      account.estado === EstadoCuentaPppoe.ELIMINADA ||
      account.estado === EstadoCuentaPppoe.CANCELADA
    ) {
      return false;
    }

    return (
      account.perfilHomologacion.mikrotikRouterId === config.expectedRouterId
    );
  });

  assert.equal(
    candidates.length,
    1,
    `Se esperaba exactamente una cuenta PPPoE del cliente ${config.clientId} ` +
      `en el router ${config.expectedRouterId}; encontradas=${candidates.length}.`,
  );

  const access = candidates[0];
  const account = access.cuentaPppoe;

  assert.ok(account, 'La cuenta PPPoE candidata no está disponible.');
  assert.equal(
    account.perfilHomologacion.activo,
    true,
    `La homologación ${account.perfilHomologacion.id} está inactiva.`,
  );

  if (client.empresaId !== null) {
    assert.equal(
      client.empresaId,
      account.empresaId,
      'Cliente y cuenta PPPoE pertenecen a empresas diferentes.',
    );
  }

  assert.equal(
    access.empresaId,
    account.empresaId,
    'Acceso y cuenta PPPoE pertenecen a empresas diferentes.',
  );

  assert.equal(
    account.perfilHomologacion.empresaId,
    account.empresaId,
    'Homologación y cuenta PPPoE pertenecen a empresas diferentes.',
  );

  const router = await prisma.mikrotikRouter.findUnique({
    where: {
      id: config.expectedRouterId,
    },
    select: {
      id: true,
      empresaId: true,
      nombre: true,
      activo: true,
    },
  });

  assert.ok(router, `No existe MikrotikRouter.id=${config.expectedRouterId}.`);
  assert.equal(router.activo, true, `El router ${router.id} está inactivo.`);
  assert.equal(
    router.empresaId,
    account.empresaId,
    'Router y cuenta PPPoE pertenecen a empresas diferentes.',
  );

  assert.equal(
    account.estado,
    EstadoCuentaPppoe.ACTIVA,
    `La cuenta debe comenzar ACTIVA y actualmente está ${account.estado}.`,
  );
  assert.equal(
    access.estado,
    EstadoAccesoInternet.ACTIVO,
    `El acceso debe comenzar ACTIVO y actualmente está ${access.estado}.`,
  );

  return {
    empresaId: account.empresaId,
    clientId: client.id,
    accessId: access.id,
    accountId: account.id,
    pppoeUser: account.usuario,
    profileId: account.perfilHomologacionId,
    profileCode: account.perfilHomologacion.codigoPerfil,
    routerId: router.id,
    routerName: router.nombre,
  };
}

async function assertNoRunningOperation(
  prisma: PrismaService,
  target: Target,
): Promise<void> {
  const running = await prisma.pppoeOperacion.findFirst({
    where: {
      empresaId: target.empresaId,
      cuentaPppoeId: target.accountId,
      estado: {
        in: [
          EstadoOperacionPppoe.PENDIENTE,
          EstadoOperacionPppoe.AUTORIZADA,
          EstadoOperacionPppoe.EJECUTANDO,
        ],
      },
    },
    orderBy: {
      creadoEn: 'desc',
    },
    select: {
      id: true,
      tipo: true,
      estado: true,
    },
  });

  assert.equal(
    running,
    null,
    running
      ? `Existe una operación PPPoE no terminal (${running.id}, ${running.tipo}, ${running.estado}).`
      : '',
  );
}

async function assertLocalStateStillActive(
  prisma: PrismaService,
  target: Target,
): Promise<void> {
  const account = await prisma.clientePppoeCuenta.findUnique({
    where: {
      id: target.accountId,
    },
    select: {
      estado: true,
      accesoInternet: {
        select: {
          estado: true,
        },
      },
    },
  });

  assert.ok(account, `La cuenta PPPoE ${target.accountId} ya no existe.`);
  assert.equal(
    account.estado,
    EstadoCuentaPppoe.ACTIVA,
    `El smoke no debe alterar el estado CRM de la cuenta. Actual=${account.estado}.`,
  );
  assert.equal(
    account.accesoInternet.estado,
    EstadoAccesoInternet.ACTIVO,
    `El smoke no debe alterar el estado del acceso. Actual=${account.accesoInternet.estado}.`,
  );
}

function openReadOnlyProbe(connection: RouterConnection): Promise<Client> {
  return new Promise<Client>((resolve, reject) => {
    const client = new Client();
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      client.end();
      reject(error);
    };

    client.once('ready', () => {
      if (settled) return;
      settled = true;
      resolve(client);
    });

    client.once('error', fail);

    client.connect({
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      readyTimeout: 10_000,
      keepaliveInterval: 5_000,
      keepaliveCountMax: 3,
    });
  });
}

async function waitForActiveSession(params: {
  client: Client;
  command: string;
  timeoutMs: number;
  intervalMs: number;
  label: string;
}): Promise<ActiveProbeResult> {
  const startedAt = Date.now();
  let polls = 0;

  while (true) {
    polls += 1;

    const count = await queryActiveCount(params.client, params.command);

    if (count > 0) {
      return {
        count,
        polls,
        waitMs: Math.max(0, Date.now() - startedAt),
      };
    }

    const elapsed = Date.now() - startedAt;

    if (elapsed >= params.timeoutMs) {
      throw new Error(
        `Timeout esperando ${params.label}: /ppp active continuó en 0 durante ${elapsed} ms (${polls} consultas).`,
      );
    }

    await delay(params.intervalMs);
  }
}

function queryActiveCount(client: Client, command: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      let stdout = '';
      let stderr = '';
      let resolved = false;

      const finishError = (errorValue: Error): void => {
        if (resolved) return;
        resolved = true;
        reject(errorValue);
      };

      stream.on('data', (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      stream.stderr.on('data', (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      stream.once('error', finishError);

      stream.once('close', () => {
        if (resolved) return;
        resolved = true;

        if (stderr.trim()) {
          reject(new Error(`RouterOS devolvió stderr en probe read-only: ${stderr.trim()}`));
          return;
        }

        const match = stdout.match(/CRM_ACTIVE_COUNT=(\d+)/);

        if (!match) {
          reject(
            new Error(
              `No pudo interpretarse CRM_ACTIVE_COUNT en el probe read-only. stdout=${JSON.stringify(stdout.trim())}`,
            ),
          );
          return;
        }

        const count = Number(match[1]);

        if (!Number.isInteger(count) || count < 0) {
          reject(new Error(`CRM_ACTIVE_COUNT inválido: ${match[1]}.`));
          return;
        }

        resolve(count);
      });
    });
  });
}

function printSummary(metrics: CycleMetric[]): void {
  console.log('===================== RESULTADOS =====================');
  console.table(metrics);

  const cyclesWithBefore = metrics.filter(
    (item) => item.sesionesEncontradasBefore > 0,
  ).length;
  const pollingUsed = metrics.filter(
    (item) => item.confirmacionIntentos > 1,
  ).length;
  const fastPath = metrics.filter(
    (item) => item.confirmacionIntentos === 1,
  ).length;

  console.log('\n====================== RESUMEN =======================');
  console.log(`Ciclos ejecutados:                  ${metrics.length}`);
  console.log(`BEFORE interno con sesión >0:      ${cyclesWithBefore}`);
  console.log(`Fast-path (1 confirmación):         ${fastPath}`);
  console.log(`Polling real (>1 confirmación):     ${pollingUsed}`);
  console.log(
    `Confirmación promedio:              ${formatMs(average(metrics.map((item) => item.confirmacionDuracionMs)))}`,
  );
  console.log(
    `Confirmación p95:                   ${formatMs(percentile(metrics.map((item) => item.confirmacionDuracionMs), 0.95))}`,
  );
  console.log(
    `Confirmación máxima:                ${formatMs(max(metrics.map((item) => item.confirmacionDuracionMs)))}`,
  );
  console.log(
    `Máximo de intentos:                 ${max(metrics.map((item) => item.confirmacionIntentos))}`,
  );
  console.log(
    `Remoción promedio total:            ${formatMs(average(metrics.map((item) => item.remocionTotalMs)))}`,
  );
  console.log(
    `Reconexión CPE promedio:            ${formatMs(average(metrics.map((item) => item.esperaReconexionMs)))}`,
  );

  if (cyclesWithBefore === 0) {
    console.log(
      '\nAVISO: el probe sí detectó sesiones antes de cada remoción, pero el BEFORE interno nunca alcanzó a verlas. ' +
        'La sesión desapareció entre el probe y removerSesionActiva(); no se logró ejercitar la mutación con BEFORE>0.',
    );
  } else if (pollingUsed === 0) {
    console.log(
      '\nSe ejercitó la remoción sobre sesiones realmente presentes, pero RouterOS convergió en la primera confirmación en todos los ciclos.',
    );
  } else {
    console.log(
      '\nÉXITO OBJETIVO: se ejercitó la remoción sobre una sesión real y el polling posterior fue necesario al menos una vez.',
    );
  }
}

function readConfig(): SmokeConfig {
  return {
    clientId: readRequiredPositiveInteger('PPPOE_SESSION_RACE_CLIENT_ID'),
    expectedRouterId: readRequiredPositiveInteger(
      'PPPOE_SESSION_RACE_EXPECTED_ROUTER_ID',
    ),
    cycles: readIntegerInRange('PPPOE_SESSION_RACE_CYCLES', 10, 1, 50),
    activeWaitTimeoutMs: readIntegerInRange(
      'PPPOE_SESSION_RACE_ACTIVE_WAIT_TIMEOUT_MS',
      60_000,
      1_000,
      300_000,
    ),
    activePollIntervalMs: readIntegerInRange(
      'PPPOE_SESSION_RACE_ACTIVE_POLL_INTERVAL_MS',
      250,
      50,
      5_000,
    ),
    postActiveSettleMs: readIntegerInRange(
      'PPPOE_SESSION_RACE_POST_ACTIVE_SETTLE_MS',
      0,
      0,
      10_000,
    ),
  };
}

function assertSafetySwitch(): void {
  if (process.env.PPPOE_SESSION_RACE_CONFIRM !== SAFETY_VALUE) {
    throw new Error(
      `Smoke REAL bloqueado. Configura PPPOE_SESSION_RACE_CONFIRM=${SAFETY_VALUE}.`,
    );
  }
}

function readRequiredPositiveInteger(key: string): number {
  const raw = process.env[key];

  if (!raw) {
    throw new Error(`Falta la variable obligatoria ${key}.`);
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} debe ser un entero positivo.`);
  }

  return value;
}

function readIntegerInRange(
  key: string,
  defaultValue: number,
  min: number,
  maxValue: number,
): number {
  const raw = process.env[key];

  if (raw === undefined || raw === '') {
    return defaultValue;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < min || value > maxValue) {
    throw new Error(`${key} debe ser un entero entre ${min} y ${maxValue}.`);
  }

  return value;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );

  return sorted[index];
}

function max(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHeader(config: SmokeConfig): void {
  console.log('============================================================');
  console.log(' SMOKE REAL - PPPoE SESSION RACE');
  console.log('============================================================');
  console.log('ATENCIÓN: esta prueba desconecta repetidamente una sesión PPPoE real.');
  console.log(`clienteId:                 ${config.clientId}`);
  console.log(`router esperado:           ${config.expectedRouterId}`);
  console.log(`ciclos:                    ${config.cycles}`);
  console.log(`timeout sesión activa:     ${config.activeWaitTimeoutMs} ms`);
  console.log(`intervalo probe:           ${config.activePollIntervalMs} ms`);
  console.log(`settle tras detectar:      ${config.postActiveSettleMs} ms`);
  console.log(`probe user-agent lógico:   ${SCRIPT_NAME}`);
}

function printTarget(target: Target): void {
  console.log('\nDestino resuelto:');
  console.log(`empresaId:                 ${target.empresaId}`);
  console.log(`clienteId:                 ${target.clientId}`);
  console.log(`accesoInternetId:          ${target.accessId}`);
  console.log(`cuentaPppoeId:             ${target.accountId}`);
  console.log(`usuario PPPoE:             ${target.pppoeUser}`);
  console.log(`perfilHomologacionId:      ${target.profileId}`);
  console.log(`perfil RouterOS:           ${target.profileCode}`);
  console.log(`routerId:                  ${target.routerId}`);
  console.log(`router:                    ${target.routerName}`);
}

function printError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`${error.name}: ${error.message}`);

    if (process.env.NODE_ENV !== 'production' && error.stack) {
      console.error(error.stack);
    }

    return;
  }

  console.error(String(error));
}

void main();
