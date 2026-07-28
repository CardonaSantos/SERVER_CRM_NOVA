import { Injectable } from '@nestjs/common';
import { Client, ClientChannel } from 'ssh2';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from '../../domain/enums/mikrotik-ssh.enums';

import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

import { ConfiguracionMikrotikSsh } from '../../domain/props/mikrotik-ssh-config.props';

import {
  EjecutarComandoMikrotikSshParams,
  ResultadoEjecucionComandoMikrotikSsh,
} from './types/mikrotik-ssh-command.types';

/**
 * Ejecuta comandos sobre un Client de ssh2
 * previamente conectado y autenticado.
 */
@Injectable()
export class MikrotikSshCommandExecutor {
  private static readonly MAX_COMMAND_LENGTH = 32_768;

  private static readonly MAX_SANITIZED_COMMAND_LENGTH = 4_096;

  execute(
    client: Client,
    config: ConfiguracionMikrotikSsh,
    params: EjecutarComandoMikrotikSshParams,
  ): Promise<ResultadoEjecucionComandoMikrotikSsh> {
    this.validateParams(params);

    const timeoutMs = params.timeoutMs ?? config.commandTimeoutMs;

    const maxOutputBytes = params.maxOutputBytes ?? config.maxOutputBytes;

    this.assertPositiveInteger(timeoutMs, 'timeoutMs');

    this.assertPositiveInteger(maxOutputBytes, 'maxOutputBytes');

    return new Promise((resolve, reject) => {
      const startedAt = Date.now();

      const stdoutChunks: Buffer[] = [];

      const stderrChunks: Buffer[] = [];

      let stream: ClientChannel | null = null;

      let timeout: NodeJS.Timeout | null = null;

      let settled = false;

      let totalOutputBytes = 0;

      let exitCode: number | null = null;

      let signal: string | null = null;

      const getDuration = (): number => Math.max(0, Date.now() - startedAt);

      const cleanup = (): void => {
        if (timeout) {
          clearTimeout(timeout);

          timeout = null;
        }

        client.removeListener('error', onClientError);

        client.removeListener('close', onClientClose);

        if (!stream) {
          return;
        }

        stream.removeListener('data', onStdoutData);

        stream.stderr.removeListener('data', onStderrData);

        stream.removeListener('exit', onStreamExit);

        stream.removeListener('close', onStreamClose);

        stream.removeListener('error', onStreamError);
      };

      const fail = (error: MikrotikSshError): void => {
        if (settled) {
          return;
        }

        settled = true;

        cleanup();

        reject(error);
      };

      const succeed = (): void => {
        if (settled) {
          return;
        }

        settled = true;

        const result: ResultadoEjecucionComandoMikrotikSsh = {
          stdout: Buffer.concat(stdoutChunks).toString('utf8'),

          stderr: Buffer.concat(stderrChunks).toString('utf8'),

          exitCode,

          signal,

          duracionMs: getDuration(),

          comandoSanitizado: params.comandoSanitizado,

          outputTruncated: false,
        };

        cleanup();

        resolve(result);
      };

      const destroyChannel = (): void => {
        if (!stream) {
          return;
        }

        try {
          stream.destroy();
        } catch {
          /**
           * El error principal ya será reportado
           * por el ejecutor.
           */
        }
      };

      const appendOutput = (target: Buffer[], data: Buffer | string): void => {
        if (settled) {
          return;
        }

        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        totalOutputBytes += buffer.byteLength;

        if (totalOutputBytes > maxOutputBytes) {
          destroyChannel();

          fail(
            new MikrotikSshError(
              'La respuesta del router superó el tamaño máximo permitido.',
              {
                codigo: CodigoErrorMikrotikSsh.SALIDA_DEMASIADO_GRANDE,

                fase: params.fase,

                efectoRemoto: params.efectoRemotoEnFallo,

                reintentable: false,

                duracionMs: getDuration(),
              },
            ),
          );

          return;
        }

        target.push(buffer);
      };

      const onStdoutData = (data: Buffer | string): void => {
        appendOutput(stdoutChunks, data);
      };

      const onStderrData = (data: Buffer | string): void => {
        appendOutput(stderrChunks, data);
      };

      const onStreamExit = (code?: number, signalName?: string): void => {
        if (typeof code === 'number') {
          exitCode = code;
        }

        if (typeof signalName === 'string') {
          signal = signalName;
        }
      };

      const onStreamClose = (code?: number, signalName?: string): void => {
        if (exitCode === null && typeof code === 'number') {
          exitCode = code;
        }

        if (signal === null && typeof signalName === 'string') {
          signal = signalName;
        }

        succeed();
      };

      const onStreamError = (cause: Error): void => {
        fail(
          new MikrotikSshError(
            'El canal SSH falló durante la ejecución del comando.',
            {
              codigo: CodigoErrorMikrotikSsh.CONEXION_PERDIDA,

              fase: params.fase,

              efectoRemoto: params.efectoRemotoEnFallo,

              reintentable: true,

              duracionMs: getDuration(),

              cause,
            },
          ),
        );
      };

      const onClientError = (cause: Error): void => {
        fail(
          new MikrotikSshError(
            'La conexión SSH se perdió durante la ejecución del comando.',
            {
              codigo: CodigoErrorMikrotikSsh.CONEXION_PERDIDA,

              fase: params.fase,

              efectoRemoto: stream
                ? params.efectoRemotoEnFallo
                : EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: true,

              duracionMs: getDuration(),

              cause,
            },
          ),
        );
      };

      const onClientClose = (): void => {
        fail(
          new MikrotikSshError(
            'La conexión SSH se cerró antes de completar el comando.',
            {
              codigo: CodigoErrorMikrotikSsh.CONEXION_PERDIDA,

              fase: params.fase,

              efectoRemoto: stream
                ? params.efectoRemotoEnFallo
                : EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: true,

              duracionMs: getDuration(),
            },
          ),
        );
      };

      client.once('error', onClientError);

      client.once('close', onClientClose);

      timeout = setTimeout(() => {
        const commandWasSent = stream !== null;

        destroyChannel();

        fail(
          new MikrotikSshError(
            commandWasSent
              ? 'El comando SSH superó el tiempo máximo permitido.'
              : 'La apertura del canal SSH superó el tiempo máximo permitido.',
            {
              codigo: CodigoErrorMikrotikSsh.TIMEOUT_COMANDO,

              fase: commandWasSent
                ? params.fase
                : FaseFalloMikrotikSsh.APERTURA_CANAL,

              efectoRemoto: commandWasSent
                ? params.efectoRemotoEnFallo
                : EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: true,

              duracionMs: getDuration(),
            },
          ),
        );
      }, timeoutMs);

      try {
        client.exec(
          params.comando,
          {
            pty: false,
          },
          (error, openedStream) => {
            if (settled) {
              openedStream?.destroy();

              return;
            }

            if (error) {
              fail(
                new MikrotikSshError(
                  'No pudo abrirse el canal para ejecutar el comando SSH.',
                  {
                    codigo: CodigoErrorMikrotikSsh.APERTURA_CANAL_FALLIDA,

                    fase: FaseFalloMikrotikSsh.APERTURA_CANAL,

                    efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

                    reintentable: true,

                    duracionMs: getDuration(),

                    cause: error,
                  },
                ),
              );

              return;
            }

            stream = openedStream;

            stream.on('data', onStdoutData);

            stream.stderr.on('data', onStderrData);

            stream.on('exit', onStreamExit);

            stream.once('close', onStreamClose);

            stream.once('error', onStreamError);
          },
        );
      } catch (cause) {
        fail(
          new MikrotikSshError(
            'No pudo iniciarse la ejecución del comando SSH.',
            {
              codigo: CodigoErrorMikrotikSsh.APERTURA_CANAL_FALLIDA,

              fase: FaseFalloMikrotikSsh.APERTURA_CANAL,

              efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: true,

              duracionMs: getDuration(),

              cause,
            },
          ),
        );
      }
    });
  }

  private validateParams(params: EjecutarComandoMikrotikSshParams): void {
    this.assertCommand(
      params.comando,
      'comando',
      MikrotikSshCommandExecutor.MAX_COMMAND_LENGTH,
    );

    this.assertCommand(
      params.comandoSanitizado,
      'comandoSanitizado',
      MikrotikSshCommandExecutor.MAX_SANITIZED_COMMAND_LENGTH,
    );

    const allowedPhases: FaseFalloMikrotikSsh[] = [
      FaseFalloMikrotikSsh.EJECUCION,

      FaseFalloMikrotikSsh.CONFIRMACION,
    ];

    if (!allowedPhases.includes(params.fase)) {
      throw new MikrotikSshError('La fase del comando SSH no es válida.', {
        codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

        fase: FaseFalloMikrotikSsh.CONFIGURACION,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: false,
      });
    }

    const allowedEffects: EfectoRemotoMikrotik[] = [
      EfectoRemotoMikrotik.NO_INICIADO,

      EfectoRemotoMikrotik.POSIBLE,
    ];

    if (!allowedEffects.includes(params.efectoRemotoEnFallo)) {
      throw new MikrotikSshError(
        'El efecto remoto configurado para el comando no es válido.',
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,
        },
      );
    }

    if (params.timeoutMs !== undefined) {
      this.assertPositiveInteger(params.timeoutMs, 'timeoutMs');
    }

    if (params.maxOutputBytes !== undefined) {
      this.assertPositiveInteger(params.maxOutputBytes, 'maxOutputBytes');
    }
  }

  private assertCommand(value: string, field: string, maxLength: number): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new MikrotikSshError(`${field} es obligatorio.`, {
        codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

        fase: FaseFalloMikrotikSsh.CONFIGURACION,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: false,
      });
    }

    if (value.includes('\n') || value.includes('\r')) {
      throw new MikrotikSshError(`${field} debe contener una sola línea.`, {
        codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

        fase: FaseFalloMikrotikSsh.CONFIGURACION,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: false,
      });
    }

    if (value.length > maxLength) {
      throw new MikrotikSshError(
        `${field} supera la longitud máxima permitida.`,
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,
        },
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new MikrotikSshError(`${field} debe ser un entero positivo.`, {
        codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

        fase: FaseFalloMikrotikSsh.CONFIGURACION,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: false,
      });
    }
  }
}
