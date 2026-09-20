import { strict as assert } from 'node:assert';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import {
  AccionAuditoriaPppoe,
  EstadoAccesoInternet,
  EstadoCuentaPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  MetodoAutenticacionInternet,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '@prisma/client';

import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { PppoeAutomatizacionModule } from 'src/modules/pppoe-automatizacion/pppoe-automatizacion.module';
import {
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-provisionamiento.port';
import { EjecutarOperacionPppoeResult } from 'src/modules/pppoe-automatizacion/domain/props/pppoe-provisionamiento.props';

/**
 * Smoke REAL de convergencia PPPoE.
 *
 * Este script:
 * - usa la base de datos real configurada en DATABASE_URL_CRM;
 * - usa las credenciales reales del router que ya conoce la aplicación;
 * - ejecuta suspensiones/reactivaciones reales;
 * - crea operaciones y auditorías reales;
 * - nunca crea, elimina ni cambia el perfil PPPoE;
 * - intenta devolver la cuenta a ACTIVA si ocurre un fallo.
 *
 * NO ejecutar contra un cliente que no esté autorizado para pruebas.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PppoeAutomatizacionModule,
  ],
})
class PppoeSessionConvergenceSmokeModule {}

type PlainObject = Record<string, unknown>;

type SmokeConfig = {
  clientId: number;
  expectedRouterId: number;
  operatorId: number;
  cycles: number;
  stableReconnectWaitMs: number;
  shortReconnectWaitMs: number;
};

type CycleScenario = 'BASELINE' | 'STABLE_RECONNECT' | 'RAPID_RESUSPEND' | 'SHORT_RECONNECT';

type CycleMetric = {
  ciclo: number;
  escenario: CycleScenario;
  esperaAntesSuspenderMs: number;
  operacionSuspensionId: number;
  operacionReactivacionId: number;
  sesionesEncontradas: number;
  sesionesRemovidas: number;
  sesionesRestantes: number;
  confirmacionIntentos: number;
  confirmacionDuracionMs: number;
  suspensionDuracionMs: number;
  reactivacionDuracionMs: number;
  idempotencia: 'OK' | 'NO_PROBADA';
};

type ResolvedSmokeTarget = {
  empresaId: number;
  clientId: number;
  accessId: number;
  accountId: number;
  pppoeUser: string;
  profileId: number;
  profileCode: string;
  routerId: number;
  routerName: string;
  operatorId: number;
  operatorName: string;
};

type LocalState = {
  cuenta: EstadoCuentaPppoe;
  acceso: EstadoAccesoInternet;
};

const SAFETY_VALUE = 'YES_REAL_PPPOE_SMOKE';
const SCRIPT_USER_AGENT = 'smoke-pppoe-session-convergence/1.0';

async function main(): Promise<void> {
  assertSafetySwitch();

  const config = readConfig();
  const runId = buildRunId();

  printHeader(config, runId);

  const app = await NestFactory.createApplicationContext(
    PppoeSessionConvergenceSmokeModule,
    {
      logger: ['error', 'warn'],
    },
  );

  const prisma = app.get(PrismaService);
  const provisionamiento = app.get<PppoeProvisionamientoPort>(
    PPPOE_PROVISIONAMIENTO,
    { strict: false },
  );

  let target: ResolvedSmokeTarget | null = null;
  const metrics: CycleMetric[] = [];
  let failed = false;

  try {
    target = await resolveAndValidateTarget(prisma, config);

    printResolvedTarget(target);

    await assertNoRunningOperation(prisma, target);
    await assertInitialState(prisma, target);

    console.log('\nValidaciones previas: OK.');
    console.log(
      `Se ejecutarán ${config.cycles} ciclos reales SUSPENDER -> REACTIVAR.`,
    );
    console.log(
      'La cuenta debe terminar ACTIVA si todas las pruebas finalizan correctamente.\n',
    );

    for (let cycle = 1; cycle <= config.cycles; cycle += 1) {
      const scenario = resolveScenario({
        cycle,
        totalCycles: config.cycles,
        stableReconnectWaitMs: config.stableReconnectWaitMs,
        shortReconnectWaitMs: config.shortReconnectWaitMs,
      });

      console.log('\n============================================================');
      console.log(`CICLO ${cycle}/${config.cycles} - ${scenario.name}`);
      console.log('============================================================');

      if (scenario.waitMs > 0) {
        console.log(
          `Esperando ${scenario.waitMs} ms antes de suspender para permitir reconexión del CPE...`,
        );
        await delay(scenario.waitMs);
      } else if (cycle > 1) {
        console.log(
          'Sin espera antes de suspender: caso de re-suspensión rápida.',
        );
      }

      await assertState(prisma, target, {
        cuenta: EstadoCuentaPppoe.ACTIVA,
        acceso: EstadoAccesoInternet.ACTIVO,
        contexto: `antes de la suspensión del ciclo ${cycle}`,
      });

      const suspensionKey = buildOperationKey(runId, cycle, 'suspend');
      const suspensionInput = {
        empresaId: target.empresaId,
        cuentaPppoeId: target.accountId,
        claveIdempotencia: suspensionKey,
        motivo: `Smoke convergencia PPPoE ciclo ${cycle}/${config.cycles}`,
        actor: {
          origen: OrigenOperacionPppoe.OPERADOR,
          iniciadoPorId: target.operatorId,
          operadorNombre: target.operatorName,
          ipOrigen: '127.0.0.1',
          userAgent: SCRIPT_USER_AGENT,
        },
      };

      const suspensionStartedAt = Date.now();
      const suspensionResult = await provisionamiento.suspenderServicio(
        suspensionInput,
      );
      const suspensionDurationMs = Date.now() - suspensionStartedAt;

      assertOperationSuccess({
        result: suspensionResult,
        expectedType: TipoOperacionPppoe.SUSPENDER_SERVICIO,
        expectedAccountState: EstadoCuentaPppoe.SUSPENDIDA,
        label: `suspensión ciclo ${cycle}`,
      });

      const suspensionMetrics = readSuspensionMetrics(suspensionResult);

      assert.equal(
        suspensionMetrics.sesionesRestantes,
        0,
        `La suspensión ${suspensionResult.operacionId} dejó sesiones restantes.`,
      );

      assert.ok(
        suspensionMetrics.confirmacionIntentos >= 1,
        'confirmacionSesionIntentos debe ser >= 1.',
      );

      assert.ok(
        suspensionMetrics.confirmacionDuracionMs >= 0,
        'confirmacionSesionDuracionMs debe ser >= 0.',
      );

      await assertState(prisma, target, {
        cuenta: EstadoCuentaPppoe.SUSPENDIDA,
        acceso: EstadoAccesoInternet.SUSPENDIDO,
        contexto: `después de la suspensión del ciclo ${cycle}`,
      });

      await assertSuspensionPersistence({
        prisma,
        operationId: suspensionResult.operacionId,
        expectedMetrics: suspensionMetrics,
      });

      let idempotency: CycleMetric['idempotencia'] = 'NO_PROBADA';

      if (cycle === 1) {
        await assertTerminalIdempotency({
          prisma,
          provisionamiento,
          input: suspensionInput,
          operationId: suspensionResult.operacionId,
          empresaId: target.empresaId,
        });

        idempotency = 'OK';
      }

      console.log(
        `Suspensión OK | op=${suspensionResult.operacionId} | ` +
          `sesiones=${suspensionMetrics.sesionesEncontradas}->${suspensionMetrics.sesionesRestantes} | ` +
          `confirmación=${suspensionMetrics.confirmacionIntentos} intento(s), ` +
          `${suspensionMetrics.confirmacionDuracionMs} ms | total=${suspensionDurationMs} ms`,
      );

      const reactivationKey = buildOperationKey(runId, cycle, 'reactivate');
      const reactivationStartedAt = Date.now();

      const reactivationResult = await provisionamiento.reactivarServicio({
        empresaId: target.empresaId,
        cuentaPppoeId: target.accountId,
        claveIdempotencia: reactivationKey,
        motivo: `Smoke reactivación PPPoE ciclo ${cycle}/${config.cycles}`,
        actor: {
          origen: OrigenOperacionPppoe.OPERADOR,
          iniciadoPorId: target.operatorId,
          operadorNombre: target.operatorName,
          ipOrigen: '127.0.0.1',
          userAgent: SCRIPT_USER_AGENT,
        },
      });

      const reactivationDurationMs = Date.now() - reactivationStartedAt;

      assertOperationSuccess({
        result: reactivationResult,
        expectedType: TipoOperacionPppoe.ACTIVAR_SECRET,
        expectedAccountState: EstadoCuentaPppoe.ACTIVA,
        label: `reactivación ciclo ${cycle}`,
      });

      await assertState(prisma, target, {
        cuenta: EstadoCuentaPppoe.ACTIVA,
        acceso: EstadoAccesoInternet.ACTIVO,
        contexto: `después de la reactivación del ciclo ${cycle}`,
      });

      console.log(
        `Reactivación OK | op=${reactivationResult.operacionId} | total=${reactivationDurationMs} ms`,
      );

      metrics.push({
        ciclo: cycle,
        escenario: scenario.name,
        esperaAntesSuspenderMs: scenario.waitMs,
        operacionSuspensionId: suspensionResult.operacionId,
        operacionReactivacionId: reactivationResult.operacionId,
        sesionesEncontradas: suspensionMetrics.sesionesEncontradas,
        sesionesRemovidas: suspensionMetrics.sesionesRemovidas,
        sesionesRestantes: suspensionMetrics.sesionesRestantes,
        confirmacionIntentos: suspensionMetrics.confirmacionIntentos,
        confirmacionDuracionMs: suspensionMetrics.confirmacionDuracionMs,
        suspensionDuracionMs: suspensionDurationMs,
        reactivacionDuracionMs: reactivationDurationMs,
        idempotencia: idempotency,
      });
    }

    await assertState(prisma, target, {
      cuenta: EstadoCuentaPppoe.ACTIVA,
      acceso: EstadoAccesoInternet.ACTIVO,
      contexto: 'al finalizar todos los ciclos',
    });

    printSummary(metrics);

    console.log('\nSMOKE REAL COMPLETADO CORRECTAMENTE.');
    console.log('Estado final confirmado: cuenta ACTIVA / acceso ACTIVO.');
  } catch (error: unknown) {
    failed = true;
    process.exitCode = 1;

    console.error('\nSMOKE REAL FALLÓ.');
    printError(error);
  } finally {
    if (target) {
      try {
        await restoreActiveStateIfNecessary({
          prisma,
          provisionamiento,
          target,
          runId,
        });
      } catch (cleanupError: unknown) {
        failed = true;
        process.exitCode = 1;
        console.error('\nADVERTENCIA: no pudo restaurarse automáticamente el estado ACTIVO.');
        printError(cleanupError);
      }
    }

    await app.close();
  }

  if (failed) {
    console.error(
      '\nLa ejecución terminó con errores. Revisa PppoeOperacion, sus pasos y la auditoría antes de repetir el smoke.',
    );
  }
}

async function resolveAndValidateTarget(
  prisma: PrismaService,
  config: SmokeConfig,
): Promise<ResolvedSmokeTarget> {
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
    `El cliente ${config.clientId} está eliminado; se aborta el smoke.`,
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
    `Se esperaba exactamente una cuenta PPPoE utilizable del cliente ${config.clientId} ` +
      `homologada al router ${config.expectedRouterId}, pero se encontraron ${candidates.length}.`,
  );

  const access = candidates[0];
  const account = access.cuentaPppoe;

  assert.ok(account, 'La cuenta PPPoE candidata desapareció durante la validación.');

  assert.equal(
    account.perfilHomologacion.activo,
    true,
    `La homologación PPPoE ${account.perfilHomologacion.id} está inactiva.`,
  );

  assert.equal(
    access.empresaId,
    account.empresaId,
    'El acceso y la cuenta PPPoE pertenecen a empresas diferentes.',
  );

  assert.equal(
    account.perfilHomologacion.empresaId,
    account.empresaId,
    'La homologación y la cuenta PPPoE pertenecen a empresas diferentes.',
  );

  if (client.empresaId !== null) {
    assert.equal(
      client.empresaId,
      account.empresaId,
      'El cliente y la cuenta PPPoE pertenecen a empresas diferentes.',
    );
  }

  const [router, operator] = await Promise.all([
    prisma.mikrotikRouter.findUnique({
      where: {
        id: config.expectedRouterId,
      },
      select: {
        id: true,
        empresaId: true,
        nombre: true,
        activo: true,
      },
    }),
    prisma.usuario.findUnique({
      where: {
        id: config.operatorId,
      },
      select: {
        id: true,
        empresaId: true,
        nombre: true,
        activo: true,
      },
    }),
  ]);

  assert.ok(router, `No existe MikrotikRouter.id=${config.expectedRouterId}.`);
  assert.equal(
    router.activo,
    true,
    `El router ${config.expectedRouterId} está inactivo.`,
  );
  assert.equal(
    router.empresaId,
    account.empresaId,
    'El router esperado y la cuenta PPPoE pertenecen a empresas diferentes.',
  );

  assert.ok(operator, `No existe Usuario.id=${config.operatorId}.`);
  assert.equal(
    operator.activo,
    true,
    `El usuario operador ${config.operatorId} está inactivo.`,
  );
  assert.equal(
    operator.empresaId,
    account.empresaId,
    'El operador y la cuenta PPPoE pertenecen a empresas diferentes.',
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
    operatorId: operator.id,
    operatorName: operator.nombre,
  };
}

async function assertInitialState(
  prisma: PrismaService,
  target: ResolvedSmokeTarget,
): Promise<void> {
  await assertState(prisma, target, {
    cuenta: EstadoCuentaPppoe.ACTIVA,
    acceso: EstadoAccesoInternet.ACTIVO,
    contexto: 'antes de iniciar el smoke',
  });
}

async function assertState(
  prisma: PrismaService,
  target: ResolvedSmokeTarget,
  expected: {
    cuenta: EstadoCuentaPppoe;
    acceso: EstadoAccesoInternet;
    contexto: string;
  },
): Promise<void> {
  const state = await readLocalState(prisma, target.accountId);

  assert.equal(
    state.cuenta,
    expected.cuenta,
    `Estado de cuenta inesperado ${expected.contexto}: esperado=${expected.cuenta}, actual=${state.cuenta}.`,
  );

  assert.equal(
    state.acceso,
    expected.acceso,
    `Estado de acceso inesperado ${expected.contexto}: esperado=${expected.acceso}, actual=${state.acceso}.`,
  );
}

async function readLocalState(
  prisma: PrismaService,
  accountId: number,
): Promise<LocalState> {
  const account = await prisma.clientePppoeCuenta.findUnique({
    where: {
      id: accountId,
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

  assert.ok(account, `La cuenta PPPoE ${accountId} ya no existe.`);

  return {
    cuenta: account.estado,
    acceso: account.accesoInternet.estado,
  };
}

async function assertNoRunningOperation(
  prisma: PrismaService,
  target: ResolvedSmokeTarget,
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
      estado: true,
      tipo: true,
    },
  });

  assert.equal(
    running,
    null,
    running
      ? `Existe una operación PPPoE no terminal (${running.id}, ${running.tipo}, ${running.estado}). Se aborta para no competir con otro flujo.`
      : '',
  );
}

function assertOperationSuccess(params: {
  result: EjecutarOperacionPppoeResult;
  expectedType: TipoOperacionPppoe;
  expectedAccountState: EstadoCuentaPppoe;
  label: string;
}): void {
  assert.equal(
    params.result.tipo,
    params.expectedType,
    `Tipo inesperado en ${params.label}.`,
  );

  assert.equal(
    params.result.estadoOperacion,
    EstadoOperacionPppoe.EXITOSA,
    `${params.label} no terminó EXITOSA. ` +
      `estado=${params.result.estadoOperacion}, ` +
      `codigo=${params.result.errorCodigo ?? 'null'}, ` +
      `mensaje=${params.result.errorMensaje ?? 'null'}`,
  );

  assert.equal(
    params.result.estadoCuenta,
    params.expectedAccountState,
    `${params.label} devolvió estadoCuenta=${params.result.estadoCuenta}.`,
  );

  assert.equal(
    params.result.errorCodigo,
    null,
    `${params.label} terminó con errorCodigo=${params.result.errorCodigo}.`,
  );
}

function readSuspensionMetrics(result: EjecutarOperacionPppoeResult): {
  sesionesEncontradas: number;
  sesionesRemovidas: number;
  sesionesRestantes: number;
  confirmacionIntentos: number;
  confirmacionDuracionMs: number;
} {
  const payload = asPlainObject(result.resultado);

  assert.ok(
    payload,
    `La suspensión ${result.operacionId} no contiene resultado técnico.`,
  );

  return {
    sesionesEncontradas: requireFiniteNumber(payload, 'sesionesEncontradas'),
    sesionesRemovidas: requireFiniteNumber(payload, 'sesionesRemovidas'),
    sesionesRestantes: requireFiniteNumber(payload, 'sesionesRestantes'),
    confirmacionIntentos: requireFiniteNumber(
      payload,
      'confirmacionSesionIntentos',
    ),
    confirmacionDuracionMs: requireFiniteNumber(
      payload,
      'confirmacionSesionDuracionMs',
    ),
  };
}

async function assertSuspensionPersistence(params: {
  prisma: PrismaService;
  operationId: number;
  expectedMetrics: {
    sesionesEncontradas: number;
    sesionesRemovidas: number;
    sesionesRestantes: number;
    confirmacionIntentos: number;
    confirmacionDuracionMs: number;
  };
}): Promise<void> {
  const operation = await params.prisma.pppoeOperacion.findUnique({
    where: {
      id: params.operationId,
    },
    select: {
      id: true,
      tipo: true,
      estado: true,
      resultado: true,
      errorCodigo: true,
      pasos: {
        orderBy: {
          orden: 'asc',
        },
        select: {
          tipo: true,
          estado: true,
          duracionMs: true,
          respuestaSanitizada: true,
        },
      },
      auditorias: {
        orderBy: {
          creadoEn: 'asc',
        },
        select: {
          accion: true,
          datos: true,
        },
      },
    },
  });

  assert.ok(operation, `No se persistió la operación ${params.operationId}.`);
  assert.equal(operation.tipo, TipoOperacionPppoe.SUSPENDER_SERVICIO);
  assert.equal(operation.estado, EstadoOperacionPppoe.EXITOSA);
  assert.equal(operation.errorCodigo, null);

  const removeStep = operation.pasos.find(
    (step) => step.tipo === TipoPasoPppoe.REMOVER_SESION_ACTIVA,
  );

  assert.ok(
    removeStep,
    `La operación ${params.operationId} no contiene REMOVER_SESION_ACTIVA.`,
  );
  assert.equal(
    removeStep.estado,
    EstadoPasoPppoe.EXITOSO,
    `REMOVER_SESION_ACTIVA de ${params.operationId} no terminó EXITOSO.`,
  );

  const suspensionAudit = operation.auditorias.find(
    (audit) => audit.accion === AccionAuditoriaPppoe.SERVICIO_SUSPENDIDO,
  );

  assert.ok(
    suspensionAudit,
    `La operación ${params.operationId} no generó auditoría SERVICIO_SUSPENDIDO.`,
  );

  const auditData = asPlainObject(suspensionAudit.datos);
  assert.ok(
    auditData,
    `SERVICIO_SUSPENDIDO de ${params.operationId} no contiene datos de auditoría.`,
  );

  assert.equal(
    requireFiniteNumber(auditData, 'sesionesEncontradas'),
    params.expectedMetrics.sesionesEncontradas,
  );
  assert.equal(
    requireFiniteNumber(auditData, 'sesionesRemovidas'),
    params.expectedMetrics.sesionesRemovidas,
  );
  assert.equal(
    requireFiniteNumber(auditData, 'sesionesRestantes'),
    params.expectedMetrics.sesionesRestantes,
  );
  assert.equal(
    requireFiniteNumber(auditData, 'confirmacionSesionIntentos'),
    params.expectedMetrics.confirmacionIntentos,
  );
  assert.equal(
    requireFiniteNumber(auditData, 'confirmacionSesionDuracionMs'),
    params.expectedMetrics.confirmacionDuracionMs,
  );
}

async function assertTerminalIdempotency(params: {
  prisma: PrismaService;
  provisionamiento: PppoeProvisionamientoPort;
  input: Parameters<PppoeProvisionamientoPort['suspenderServicio']>[0];
  operationId: number;
  empresaId: number;
}): Promise<void> {
  console.log('Probando idempotencia terminal con la MISMA clave...');

  const [auditCountBefore, operationCountBefore] = await Promise.all([
    params.prisma.pppoeAuditoria.count({
      where: {
        operacionId: params.operationId,
      },
    }),
    params.prisma.pppoeOperacion.count({
      where: {
        empresaId: params.empresaId,
        claveIdempotencia: params.input.claveIdempotencia,
      },
    }),
  ]);

  const replay = await params.provisionamiento.suspenderServicio(params.input);

  assert.equal(
    replay.operacionId,
    params.operationId,
    'La misma clave de idempotencia devolvió una operación diferente.',
  );

  const [auditCountAfter, operationCountAfter] = await Promise.all([
    params.prisma.pppoeAuditoria.count({
      where: {
        operacionId: params.operationId,
      },
    }),
    params.prisma.pppoeOperacion.count({
      where: {
        empresaId: params.empresaId,
        claveIdempotencia: params.input.claveIdempotencia,
      },
    }),
  ]);

  assert.equal(
    operationCountBefore,
    1,
    'La clave de idempotencia no era única antes del replay.',
  );
  assert.equal(
    operationCountAfter,
    1,
    'El replay creó una segunda PppoeOperacion.',
  );
  assert.equal(
    auditCountAfter,
    auditCountBefore,
    'El replay terminal generó nuevas auditorías; posiblemente volvió a ejecutar el flujo.',
  );

  console.log('Idempotencia terminal: OK; no se creó otra operación ni auditoría.');
}

async function restoreActiveStateIfNecessary(params: {
  prisma: PrismaService;
  provisionamiento: PppoeProvisionamientoPort;
  target: ResolvedSmokeTarget;
  runId: string;
}): Promise<void> {
  let state = await readLocalState(params.prisma, params.target.accountId);

  if (
    state.cuenta === EstadoCuentaPppoe.ACTIVA &&
    state.acceso === EstadoAccesoInternet.ACTIVO
  ) {
    return;
  }

  console.warn(
    `\nRestauración defensiva: estado actual cuenta=${state.cuenta}, acceso=${state.acceso}.`,
  );

  if (state.cuenta === EstadoCuentaPppoe.ERROR) {
    const latestSmokeOperation = await params.prisma.pppoeOperacion.findFirst({
      where: {
        empresaId: params.target.empresaId,
        cuentaPppoeId: params.target.accountId,
        claveIdempotencia: {
          startsWith: `smoke:pppoe-convergence:${params.runId}:`,
        },
        estado: {
          in: [EstadoOperacionPppoe.PARCIAL, EstadoOperacionPppoe.FALLIDA],
        },
      },
      orderBy: {
        creadoEn: 'desc',
      },
      select: {
        id: true,
        tipo: true,
      },
    });

    if (!latestSmokeOperation) {
      throw new Error(
        'La cuenta quedó ERROR y no existe una operación fallida de este smoke que pueda reintentarse de forma segura.',
      );
    }

    console.warn(
      `Intentando recuperación con reintento de la operación smoke ${latestSmokeOperation.id} (${latestSmokeOperation.tipo})...`,
    );

    const retry = await params.provisionamiento.reintentarOperacion({
      empresaId: params.target.empresaId,
      operacionId: latestSmokeOperation.id,
      claveIdempotencia: `smoke:pppoe-convergence:${params.runId}:cleanup:retry:${Date.now()}`,
      motivo: 'Recuperación automática del smoke PPPoE',
      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,
        iniciadoPorId: params.target.operatorId,
        operadorNombre: params.target.operatorName,
        ipOrigen: '127.0.0.1',
        userAgent: SCRIPT_USER_AGENT,
      },
    });

    if (retry.estadoOperacion !== EstadoOperacionPppoe.EXITOSA) {
      throw new Error(
        `El reintento de recuperación ${retry.operacionId} no terminó EXITOSA: ` +
          `${retry.estadoOperacion} / ${retry.errorCodigo ?? 'sin código'}.`,
      );
    }

    state = await readLocalState(params.prisma, params.target.accountId);
  }

  if (
    state.cuenta === EstadoCuentaPppoe.ACTIVA &&
    state.acceso === EstadoAccesoInternet.ACTIVO
  ) {
    console.warn('La recuperación dejó la cuenta ACTIVA.');
    return;
  }

  if (state.cuenta !== EstadoCuentaPppoe.SUSPENDIDA) {
    throw new Error(
      `No es seguro reactivar automáticamente desde cuenta=${state.cuenta}, acceso=${state.acceso}.`,
    );
  }

  console.warn('Reactivando la cuenta para restaurar el estado inicial ACTIVO...');

  const restore = await params.provisionamiento.reactivarServicio({
    empresaId: params.target.empresaId,
    cuentaPppoeId: params.target.accountId,
    claveIdempotencia: `smoke:pppoe-convergence:${params.runId}:cleanup:reactivate:${Date.now()}`,
    motivo: 'Restauración automática después del smoke PPPoE',
    actor: {
      origen: OrigenOperacionPppoe.OPERADOR,
      iniciadoPorId: params.target.operatorId,
      operadorNombre: params.target.operatorName,
      ipOrigen: '127.0.0.1',
      userAgent: SCRIPT_USER_AGENT,
    },
  });

  assertOperationSuccess({
    result: restore,
    expectedType: TipoOperacionPppoe.ACTIVAR_SECRET,
    expectedAccountState: EstadoCuentaPppoe.ACTIVA,
    label: 'restauración final',
  });

  await assertState(params.prisma, params.target, {
    cuenta: EstadoCuentaPppoe.ACTIVA,
    acceso: EstadoAccesoInternet.ACTIVO,
    contexto: 'después de restauración automática',
  });

  console.warn('Restauración automática: OK.');
}

function resolveScenario(params: {
  cycle: number;
  totalCycles: number;
  stableReconnectWaitMs: number;
  shortReconnectWaitMs: number;
}): { name: CycleScenario; waitMs: number } {
  if (params.cycle === 1) {
    return {
      name: 'BASELINE',
      waitMs: 0,
    };
  }

  if (params.totalCycles >= 4 && params.cycle === params.totalCycles - 2) {
    return {
      name: 'RAPID_RESUSPEND',
      waitMs: 0,
    };
  }

  if (params.totalCycles >= 4 && params.cycle === params.totalCycles - 1) {
    return {
      name: 'SHORT_RECONNECT',
      waitMs: params.shortReconnectWaitMs,
    };
  }

  return {
    name: 'STABLE_RECONNECT',
    waitMs: params.stableReconnectWaitMs,
  };
}

function printSummary(metrics: CycleMetric[]): void {
  console.log('\n===================== RESULTADOS =====================');
  console.table(metrics);

  const confirmations = metrics.map((item) => item.confirmacionDuracionMs);
  const attempts = metrics.map((item) => item.confirmacionIntentos);
  const suspensionDurations = metrics.map((item) => item.suspensionDuracionMs);
  const reactivationDurations = metrics.map((item) => item.reactivacionDuracionMs);

  const sessionsPresent = metrics.filter(
    (item) => item.sesionesEncontradas > 0,
  ).length;
  const fastPath = metrics.filter((item) => item.confirmacionIntentos === 1).length;
  const pollingUsed = metrics.filter(
    (item) => item.confirmacionIntentos > 1,
  ).length;

  console.log('\n====================== RESUMEN =======================');
  console.log(`Ciclos exitosos:                  ${metrics.length}`);
  console.log(`Ciclos con sesión en BEFORE:      ${sessionsPresent}`);
  console.log(`Fast-path (1 confirmación):       ${fastPath}`);
  console.log(`Polling real (>1 confirmación):   ${pollingUsed}`);
  console.log(
    `Confirmación promedio:            ${formatMs(average(confirmations))}`,
  );
  console.log(
    `Confirmación p95:                 ${formatMs(percentile(confirmations, 0.95))}`,
  );
  console.log(
    `Confirmación máxima:              ${formatMs(max(confirmations))}`,
  );
  console.log(`Máximo de intentos:               ${max(attempts)}`);
  console.log(
    `Suspensión promedio total:        ${formatMs(average(suspensionDurations))}`,
  );
  console.log(
    `Reactivación promedio total:      ${formatMs(average(reactivationDurations))}`,
  );

  if (pollingUsed === 0) {
    console.log(
      '\nNota: RouterOS convergió siempre en la primera comprobación. ' +
        'El smoke validó el fast-path, pero no consiguió provocar convergencia tardía en esta ejecución real.',
    );
  } else {
    console.log(
      '\nEl polling fue utilizado al menos una vez: se ejercitó directamente el caso que motivó el refactor.',
    );
  }
}

function readConfig(): SmokeConfig {
  return {
    clientId: readRequiredPositiveInteger('PPPOE_SMOKE_CLIENT_ID'),
    expectedRouterId: readRequiredPositiveInteger(
      'PPPOE_SMOKE_EXPECTED_ROUTER_ID',
    ),
    operatorId: readRequiredPositiveInteger('PPPOE_SMOKE_OPERATOR_ID'),
    cycles: readIntegerInRange('PPPOE_SMOKE_CYCLES', 10, 4, 50),
    stableReconnectWaitMs: readIntegerInRange(
      'PPPOE_SMOKE_RECONNECT_WAIT_MS',
      25_000,
      0,
      120_000,
    ),
    shortReconnectWaitMs: readIntegerInRange(
      'PPPOE_SMOKE_SHORT_RECONNECT_WAIT_MS',
      1_000,
      0,
      30_000,
    ),
  };
}

function assertSafetySwitch(): void {
  if (process.env.PPPOE_SMOKE_CONFIRM !== SAFETY_VALUE) {
    throw new Error(
      `Smoke REAL bloqueado. Configura PPPOE_SMOKE_CONFIRM=${SAFETY_VALUE} para autorizar escrituras reales.`,
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

function buildRunId(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  const entropy = Math.random().toString(36).slice(2, 8);

  return `${timestamp}-${process.pid}-${entropy}`;
}

function buildOperationKey(
  runId: string,
  cycle: number,
  action: 'suspend' | 'reactivate',
): string {
  return `smoke:pppoe-convergence:${runId}:cycle-${cycle}:${action}`;
}

function asPlainObject(value: unknown): PlainObject | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as PlainObject;
}

function requireFiniteNumber(source: PlainObject, key: string): number {
  const value = source[key];

  assert.ok(
    typeof value === 'number' && Number.isFinite(value),
    `El campo ${key} no contiene un número finito. Valor=${String(value)}.`,
  );

  return value;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }

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
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHeader(config: SmokeConfig, runId: string): void {
  console.log('============================================================');
  console.log(' SMOKE REAL - PPPoE SESSION CONVERGENCE');
  console.log('============================================================');
  console.log('ATENCIÓN: esta prueba modifica temporalmente un servicio real.');
  console.log(`runId:                 ${runId}`);
  console.log(`clienteId:             ${config.clientId}`);
  console.log(`router esperado:       ${config.expectedRouterId}`);
  console.log(`operador:              ${config.operatorId}`);
  console.log(`ciclos:                ${config.cycles}`);
  console.log(`espera estable:        ${config.stableReconnectWaitMs} ms`);
  console.log(`espera corta:          ${config.shortReconnectWaitMs} ms`);
}

function printResolvedTarget(target: ResolvedSmokeTarget): void {
  console.log('\nDestino resuelto:');
  console.log(`empresaId:             ${target.empresaId}`);
  console.log(`clienteId:             ${target.clientId}`);
  console.log(`accesoInternetId:      ${target.accessId}`);
  console.log(`cuentaPppoeId:         ${target.accountId}`);
  console.log(`usuario PPPoE:         ${target.pppoeUser}`);
  console.log(`perfilHomologacionId:  ${target.profileId}`);
  console.log(`perfil RouterOS:       ${target.profileCode}`);
  console.log(`routerId:              ${target.routerId}`);
  console.log(`router:                ${target.routerName}`);
  console.log(`operadorId:            ${target.operatorId}`);
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
