import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import {
  CodigoErrorMikrotikSsh,
  MetodoAutenticacionMikrotikSsh,
} from '../src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

import { MikrotikSshError } from '../src/modules/mikrotik-ssh/domain/errors/mikrotik-ssh.error';

import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from '../src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from '../src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';

import { VerificacionHostMikrotikSsh } from '../src/modules/mikrotik-ssh/domain/props/mikrotik-ssh-auth.props';

import { MikrotikSshModule } from '../src/modules/mikrotik-ssh/mikrotik-ssh.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MikrotikSshModule,
  ],
})
class MikrotikSshWriteTestModule {}

async function bootstrap(): Promise<void> {
  assertWriteTestEnabled();

  const app = await NestFactory.createApplicationContext(
    MikrotikSshWriteTestModule,
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  let session: MikrotikSshSessionPort | null = null;

  let cleanupAuthorized = false;

  const usuarioPppoe = buildTemporaryUsername();

  const codigoPerfil = requiredEnv('MIKROTIK_TEST_WRITE_PROFILE').trim();

  try {
    const ssh = app.get<MikrotikSshPort>(MIKROTIK_SSH_PORT);

    const host = requiredEnv('MIKROTIK_TEST_HOST').trim();

    const port = parsePort(process.env.MIKROTIK_TEST_PORT ?? '22');

    const username = requiredEnv('MIKROTIK_TEST_USERNAME').trim();

    const sshPassword = requiredEnv('MIKROTIK_TEST_PASSWORD');

    const pppoePassword = requiredEnv('MIKROTIK_TEST_WRITE_PASSWORD');

    console.log(`Abriendo sesión SSH con ${host}:${port}...`);

    session = await ssh.abrirSesion({
      host,

      port,

      username,

      autenticacion: {
        metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

        password: sshPassword,
      },

      verificacionHost: buildHostVerification(),
    });

    console.log('Sesión SSH abierta.');

    console.log(`Usuario temporal: ${usuarioPppoe}`);

    /**
     * 1. Confirmar que el nombre temporal no existe.
     */
    const initialSearch = await session.buscarSecret({
      usuarioPppoe,
    });

    if (initialSearch.encontrado) {
      throw new Error(
        `El secret temporal ${usuarioPppoe} ya existe. Se cancela la prueba.`,
      );
    }

    /**
     * Desde aquí el script puede limpiar únicamente
     * este usuario temporal.
     */
    cleanupAuthorized = true;

    console.log('✓ El secret temporal no existe.');

    /**
     * 2. Crear inicialmente deshabilitado.
     */
    await session.crearSecret({
      usuarioPppoe,

      passwordPppoe: pppoePassword,

      codigoPerfil,

      deshabilitado: true,

      comentario: 'CRM SSH WRITE TEST',
    });

    console.log('✓ Comando de creación aceptado.');

    /**
     * 3. Confirmar creación y estado deshabilitado.
     */
    await session.confirmarSecret({
      debeExistir: true,

      usuarioPppoe,

      codigoPerfilEsperado: codigoPerfil,

      deshabilitadoEsperado: true,
    });

    console.log('✓ Creación confirmada con estado deshabilitado.');

    /**
     * 4. Probar protección contra creación duplicada.
     */
    await assertDuplicateCreationRejected(session, {
      usuarioPppoe,

      passwordPppoe: pppoePassword,

      codigoPerfil,
    });

    console.log('✓ La creación duplicada fue rechazada correctamente.');

    /**
     * 5. Habilitar.
     */
    await session.habilitarSecret({
      usuarioPppoe,
    });

    await session.confirmarSecret({
      debeExistir: true,

      usuarioPppoe,

      codigoPerfilEsperado: codigoPerfil,

      deshabilitadoEsperado: false,
    });

    console.log('✓ Secret habilitado y confirmado.');

    /**
     * 6. Deshabilitar.
     */
    await session.deshabilitarSecret({
      usuarioPppoe,
    });

    await session.confirmarSecret({
      debeExistir: true,

      usuarioPppoe,

      codigoPerfilEsperado: codigoPerfil,

      deshabilitadoEsperado: true,
    });

    console.log('✓ Secret deshabilitado y confirmado.');

    /**
     * 7. Remover sesiones activas.
     *
     * Como el usuario temporal probablemente nunca inició
     * sesión, lo esperado normalmente será cero.
     */
    const activeResult = await session.removerSesionActiva({
      usuarioPppoe,
    });

    console.log('✓ Remoción de sesiones procesada.');

    console.dir(
      {
        sesionesEncontradas: activeResult.sesionesEncontradas,

        sesionesRemovidas: activeResult.sesionesRemovidas,

        sesionesRestantes: activeResult.sesionesRestantes,

        duracionMs: activeResult.duracionMs,
      },
      {
        depth: null,
      },
    );

    /**
     * 8. Eliminar secret.
     */
    await session.eliminarSecret({
      usuarioPppoe,
    });

    console.log('✓ Comando de eliminación aceptado.');

    /**
     * 9. Confirmar que ya no existe.
     */
    await session.confirmarSecret({
      debeExistir: false,

      usuarioPppoe,
    });

    console.log('✓ Eliminación confirmada.');

    cleanupAuthorized = false;

    console.log('PRUEBA COMPLETA EXITOSA.');
  } catch (error) {
    process.exitCode = 1;

    console.error('La prueba de escritura falló.');

    if (MikrotikSshError.is(error)) {
      console.dir(error.toPrimitives(), {
        depth: null,
      });
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
  } finally {
    if (session && cleanupAuthorized) {
      await cleanupTemporarySecret(session, usuarioPppoe, codigoPerfil);
    }

    if (session) {
      try {
        await session.cerrar();

        console.log('Sesión SSH cerrada.');
      } catch (error) {
        process.exitCode = 1;

        console.error('Falló el cierre de la sesión SSH.');

        if (MikrotikSshError.is(error)) {
          console.dir(error.toPrimitives(), {
            depth: null,
          });
        }
      }
    }

    await app.close();
  }
}

async function assertDuplicateCreationRejected(
  session: MikrotikSshSessionPort,
  params: {
    usuarioPppoe: string;
    passwordPppoe: string;
    codigoPerfil: string;
  },
): Promise<void> {
  try {
    await session.crearSecret({
      usuarioPppoe: params.usuarioPppoe,

      passwordPppoe: params.passwordPppoe,

      codigoPerfil: params.codigoPerfil,

      deshabilitado: true,

      comentario: 'CRM SSH WRITE TEST DUPLICATE',
    });
  } catch (error) {
    if (
      MikrotikSshError.is(error) &&
      error.codigo === CodigoErrorMikrotikSsh.SECRET_YA_EXISTE
    ) {
      return;
    }

    throw error;
  }

  throw new Error('RouterOS permitió crear un secret duplicado.');
}

/**
 * Limpieza defensiva si la prueba falla
 * después de crear el secret temporal.
 */
async function cleanupTemporarySecret(
  session: MikrotikSshSessionPort,
  usuarioPppoe: string,
  codigoPerfilEsperado: string,
): Promise<void> {
  console.warn(`Intentando limpiar el secret temporal ${usuarioPppoe}...`);

  try {
    const search = await session.buscarSecret({
      usuarioPppoe,
    });

    if (!search.encontrado || !search.secret) {
      console.log('El secret temporal ya no existe.');

      return;
    }

    if (search.secret.codigoPerfil !== codigoPerfilEsperado) {
      console.error(
        'No se eliminó el secret durante la limpieza porque su perfil no coincide con el perfil de prueba.',
      );

      return;
    }

    await session.deshabilitarSecret({
      usuarioPppoe,
    });

    await session.removerSesionActiva({
      usuarioPppoe,
    });

    await session.eliminarSecret({
      usuarioPppoe,
    });

    await session.confirmarSecret({
      debeExistir: false,

      usuarioPppoe,
    });

    console.log('Secret temporal eliminado durante la limpieza.');
  } catch (error) {
    process.exitCode = 1;

    console.error('No pudo completarse la limpieza automática.');

    if (MikrotikSshError.is(error)) {
      console.dir(error.toPrimitives(), {
        depth: null,
      });
    }
  }
}

function buildTemporaryUsername(): string {
  const configured = process.env.MIKROTIK_TEST_WRITE_USER?.trim();

  if (configured) {
    if (!configured.startsWith('crm-test-')) {
      throw new Error('MIKROTIK_TEST_WRITE_USER debe comenzar con crm-test-.');
    }

    return configured;
  }

  return `crm-test-${Date.now().toString(36)}`;
}

function buildHostVerification(): VerificacionHostMikrotikSsh {
  const fingerprint = process.env.MIKROTIK_TEST_HOST_FINGERPRINT?.trim();

  if (fingerprint) {
    return {
      verificar: true,

      huellaSha256: fingerprint,
    };
  }

  return {
    verificar: false,
  };
}

function assertWriteTestEnabled(): void {
  const confirmation = process.env.MIKROTIK_TEST_WRITE_CONFIRM;

  if (confirmation !== 'YES_WRITE_TEST') {
    throw new Error(
      'Para ejecutar esta prueba debes configurar MIKROTIK_TEST_WRITE_CONFIRM=YES_WRITE_TEST.',
    );
  }
}

function requiredEnv(key: string): string {
  const value = process.env[key];

  if (value === undefined || value.length === 0) {
    throw new Error(`Falta la variable de entorno ${key}.`);
  }

  return value;
}

function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('MIKROTIK_TEST_PORT debe estar entre 1 y 65535.');
  }

  return port;
}

void bootstrap();
