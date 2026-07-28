import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MetodoAutenticacionMikrotikSsh } from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';
import { MikrotikSshError } from 'src/modules/mikrotik-ssh/domain/errors/mikrotik-ssh.error';
import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';
import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';
import { VerificacionHostMikrotikSsh } from 'src/modules/mikrotik-ssh/domain/props/mikrotik-ssh-auth.props';
import { MikrotikSshModule } from 'src/modules/mikrotik-ssh/mikrotik-ssh.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MikrotikSshModule,
  ],
})
class MikrotikSshTestModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(
    MikrotikSshTestModule,
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  let session: MikrotikSshSessionPort | null = null;

  try {
    const ssh = app.get<MikrotikSshPort>(MIKROTIK_SSH_PORT);

    const host = requiredEnv('MIKROTIK_TEST_HOST').trim();

    const port = parsePort(process.env.MIKROTIK_TEST_PORT ?? '22');

    const username = requiredEnv('MIKROTIK_TEST_USERNAME').trim();

    /**
     * No se imprime ni se registra.
     */
    const password = requiredEnv('MIKROTIK_TEST_PASSWORD');

    const usuarioPppoe =
      process.env.MIKROTIK_TEST_PPPOE_USER?.trim() ||
      '__crm_ssh_test_no_existente__';

    const verificacionHost = buildHostVerification();

    console.log(`Abriendo sesión SSH con ${host}:${port}...`);

    session = await ssh.abrirSesion({
      host,

      port,

      username,

      autenticacion: {
        metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

        password,
      },

      verificacionHost,
    });

    console.log('Sesión SSH abierta correctamente.');

    console.dir(session.obtenerInfo(), {
      depth: null,
    });

    console.log(`Buscando el secret PPPoE "${usuarioPppoe}"...`);

    const result = await session.buscarSecret({
      usuarioPppoe,
    });

    console.log('Comando ejecutado correctamente.');

    console.dir(
      {
        encontrado: result.encontrado,

        usuarioPppoe: result.usuarioPppoe,

        secret: result.secret,

        duracionMs: result.duracionMs,

        comandoSanitizado: result.comandoSanitizado,

        respuestaSanitizada: result.respuestaSanitizada,
      },
      {
        depth: null,
      },
    );
  } catch (error) {
    process.exitCode = 1;

    if (MikrotikSshError.is(error)) {
      console.error('La prueba SSH falló:');

      console.dir(error.toPrimitives(), {
        depth: null,
      });

      return;
    }

    console.error('Error no normalizado durante la prueba SSH:');

    console.error(error instanceof Error ? error.message : String(error));
  } finally {
    if (session) {
      try {
        await session.cerrar();

        console.log('Sesión SSH cerrada.');
      } catch (error) {
        process.exitCode = 1;

        console.error('La sesión se utilizó, pero falló durante el cierre.');

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
