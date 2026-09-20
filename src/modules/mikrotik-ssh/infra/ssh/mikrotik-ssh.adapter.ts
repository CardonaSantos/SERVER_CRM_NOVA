import { Inject, Injectable } from '@nestjs/common';

import { createHash, timingSafeEqual } from 'node:crypto';

import { Client, ConnectConfig } from 'ssh2';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
  MetodoAutenticacionMikrotikSsh,
} from '../../domain/enums/mikrotik-ssh.enums';

import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

import { MikrotikSshPort } from '../../domain/ports/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from '../../domain/ports/mikrotik-ssh-session.port';

import { ConfiguracionMikrotikSsh } from '../../domain/props/mikrotik-ssh-config.props';

import { AbrirSesionMikrotikSshParams } from '../../domain/props/mikrotik-ssh-session.props';

import { MikrotikPppoeCommandBuilder } from '../routeros/mikrotik-pppoe-command.builder';

import { MikrotikPppoeResponseParser } from '../routeros/mikrotik-pppoe-response.parser';

import { MikrotikSshCommandExecutor } from './mikrotik-ssh-command.executor';

import { MikrotikSshSession } from './mikrotik-ssh.session';
import { MIKROTIK_SSH_CONFIG } from '../tokens/mikrotik-ssh-config.token';

type Ssh2ConnectionError = Error & {
  code?: string;

  level?: string;

  errno?: string | number;

  syscall?: string;
};

/**
 * Implementación concreta del puerto SSH mediante ssh2.
 *
 * Cada llamada a abrirSesion crea un Client independiente.
 */
@Injectable()
export class MikrotikSshAdapter implements MikrotikSshPort {
  constructor(
    @Inject(MIKROTIK_SSH_CONFIG)
    private readonly config: ConfiguracionMikrotikSsh,

    private readonly commandBuilder: MikrotikPppoeCommandBuilder,

    private readonly commandExecutor: MikrotikSshCommandExecutor,

    private readonly responseParser: MikrotikPppoeResponseParser,
  ) {}

  abrirSesion(
    params: AbrirSesionMikrotikSshParams,
  ): Promise<MikrotikSshSessionPort> {
    this.validateParams(params);

    const client = new Client();

    const startedAt = Date.now();

    let hostKeyRejected = false;

    const connectConfig = this.buildConnectConfig(
      params,

      () => {
        hostKeyRejected = true;
      },
    );

    return new Promise<MikrotikSshSessionPort>((resolve, reject) => {
      let settled = false;

      const getDuration = (): number => Math.max(0, Date.now() - startedAt);

      const cleanup = (): void => {
        client.removeListener('ready', onReady);

        client.removeListener('error', onError);

        client.removeListener('close', onClose);

        client.removeListener('end', onEnd);
      };

      const fail = (cause: unknown): void => {
        if (settled) {
          return;
        }

        settled = true;

        cleanup();

        this.safeCloseClient(client);

        reject(
          this.normalizeConnectionError(
            cause,

            getDuration(),

            hostKeyRejected,
          ),
        );
      };

      const onReady = (): void => {
        if (settled) {
          return;
        }

        settled = true;

        cleanup();

        try {
          client.setNoDelay(true);
        } catch {
          /**
           * No impide utilizar la conexión.
           */
        }

        resolve(
          new MikrotikSshSession(
            client,

            {
              host: params.host,

              port: params.port,

              username: params.username,

              conectadoEn: new Date(),

              duracionConexionMs: getDuration(),
            },

            this.config,

            this.commandBuilder,

            this.commandExecutor,

            this.responseParser,
          ),
        );
      };

      const onError = (error: Error): void => {
        fail(error);
      };

      const onClose = (): void => {
        fail(new Error('La conexión SSH se cerró antes de quedar disponible.'));
      };

      const onEnd = (): void => {
        fail(
          new Error('El router finalizó la conexión durante la autenticación.'),
        );
      };

      client.once('ready', onReady);

      client.once('error', onError);

      client.once('close', onClose);

      client.once('end', onEnd);

      try {
        client.connect(connectConfig);
      } catch (cause) {
        fail(cause);
      }
    });
  }

  private buildConnectConfig(
    params: AbrirSesionMikrotikSshParams,
    onHostKeyRejected: () => void,
  ): ConnectConfig {
    const connectConfig: ConnectConfig = {
      host: params.host,

      port: params.port,

      username: params.username,

      readyTimeout: this.config.readyTimeoutMs,

      keepaliveInterval: this.config.keepaliveIntervalMs,

      keepaliveCountMax: this.config.keepaliveCountMax,

      /**
       * No utilizaremos autenticación
       * keyboard-interactive.
       */
      tryKeyboard: false,
    };

    if (params.verificacionHost.verificar) {
      const expectedFingerprint = params.verificacionHost.huellaSha256;

      connectConfig.hostVerifier = (hostKey: Buffer): boolean => {
        const matches = this.verifyHostFingerprint(
          hostKey,
          expectedFingerprint,
        );

        if (!matches) {
          onHostKeyRejected();
        }

        return matches;
      };
    }

    switch (params.autenticacion.metodo) {
      case MetodoAutenticacionMikrotikSsh.PASSWORD:
        connectConfig.password = params.autenticacion.password;

        break;

      case MetodoAutenticacionMikrotikSsh.PRIVATE_KEY:
        connectConfig.privateKey = params.autenticacion.privateKey;

        if (params.autenticacion.passphrase) {
          connectConfig.passphrase = params.autenticacion.passphrase;
        }

        break;

      default: {
        const exhaustiveCheck: never = params.autenticacion;

        throw this.configurationError(
          `Método de autenticación no soportado: ${String(exhaustiveCheck)}.`,
        );
      }
    }

    return connectConfig;
  }

  /**
   * Compara una huella SHA-256 en formato:
   *
   * SHA256:xxxxxxxx
   *
   * o únicamente:
   *
   * xxxxxxxx
   */
  private verifyHostFingerprint(
    hostKey: Buffer,
    expectedFingerprint: string,
  ): boolean {
    const actualFingerprint = createHash('sha256')
      .update(hostKey)
      .digest('base64');

    const normalizedActual = this.normalizeFingerprint(actualFingerprint);

    const normalizedExpected = this.normalizeFingerprint(expectedFingerprint);

    const actualBuffer = Buffer.from(normalizedActual, 'utf8');

    const expectedBuffer = Buffer.from(normalizedExpected, 'utf8');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
  }

  private normalizeFingerprint(value: string): string {
    return value
      .trim()
      .replace(/^SHA256:/i, '')
      .replace(/=+$/g, '');
  }

  private validateParams(params: AbrirSesionMikrotikSshParams): void {
    this.assertRequiredString(params.host, 'host', 255);

    if (
      params.host.includes('://') ||
      params.host.includes('/') ||
      /\s/u.test(params.host)
    ) {
      throw this.configurationError(
        'host debe contener únicamente un hostname o una dirección IP.',
      );
    }

    if (
      !Number.isInteger(params.port) ||
      params.port < 1 ||
      params.port > 65_535
    ) {
      throw this.configurationError('port debe estar entre 1 y 65535.');
    }

    this.assertRequiredString(params.username, 'username', 255);

    this.assertNoControlCharacters(params.username, 'username');

    this.validateAuthentication(params);

    this.validateHostVerification(params);
  }

  private validateAuthentication(params: AbrirSesionMikrotikSshParams): void {
    switch (params.autenticacion.metodo) {
      case MetodoAutenticacionMikrotikSsh.PASSWORD:
        this.assertRequiredString(
          params.autenticacion.password,
          'password SSH',
          4_096,
        );

        this.assertNoControlCharacters(
          params.autenticacion.password,
          'password SSH',
        );

        return;

      case MetodoAutenticacionMikrotikSsh.PRIVATE_KEY:
        this.assertRequiredString(
          params.autenticacion.privateKey,
          'privateKey',
          1_048_576,
        );

        if (
          params.autenticacion.passphrase !== undefined &&
          params.autenticacion.passphrase !== null
        ) {
          this.assertRequiredString(
            params.autenticacion.passphrase,
            'passphrase',
            4_096,
          );

          this.assertNoControlCharacters(
            params.autenticacion.passphrase,
            'passphrase',
          );
        }

        return;

      default: {
        const exhaustiveCheck: never = params.autenticacion;

        throw this.configurationError(
          `Método de autenticación no soportado: ${String(exhaustiveCheck)}.`,
        );
      }
    }
  }

  private validateHostVerification(params: AbrirSesionMikrotikSshParams): void {
    if (!params.verificacionHost.verificar) {
      if (!this.config.permitirHostNoVerificado) {
        throw this.configurationError(
          'La verificación de huella SSH es obligatoria según la configuración actual.',
        );
      }

      return;
    }

    const fingerprint = this.normalizeFingerprint(
      params.verificacionHost.huellaSha256,
    );

    if (!fingerprint || !/^[A-Za-z0-9+/]+$/u.test(fingerprint)) {
      throw this.configurationError(
        'La huella SHA-256 del router tiene un formato inválido.',
      );
    }

    const paddedFingerprint = fingerprint.padEnd(
      Math.ceil(fingerprint.length / 4) * 4,
      '=',
    );

    const decoded = Buffer.from(paddedFingerprint, 'base64');

    if (decoded.length !== 32) {
      throw this.configurationError(
        'La huella SSH no representa un hash SHA-256 válido.',
      );
    }
  }

  private normalizeConnectionError(
    cause: unknown,
    duracionMs: number,
    hostKeyRejected: boolean,
  ): MikrotikSshError {
    if (MikrotikSshError.is(cause)) {
      return cause;
    }

    if (hostKeyRejected) {
      return new MikrotikSshError(
        'La identidad SSH del router no coincide con la huella registrada.',
        {
          codigo: CodigoErrorMikrotikSsh.HUELLA_HOST_NO_COINCIDE,

          fase: FaseFalloMikrotikSsh.HANDSHAKE,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,

          duracionMs,

          cause,
        },
      );
    }

    const error = this.toConnectionError(cause);

    const code = error.code?.toUpperCase();

    const level = error.level?.toLowerCase();

    const message = error.message.toLowerCase();

    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
      return this.connectionError(
        'No pudo resolverse el nombre del router.',

        CodigoErrorMikrotikSsh.DNS_NO_RESUELTO,

        FaseFalloMikrotikSsh.CONEXION,

        true,

        duracionMs,

        cause,
      );
    }

    if (code === 'ECONNREFUSED') {
      return this.connectionError(
        'El router rechazó la conexión SSH.',

        CodigoErrorMikrotikSsh.CONEXION_RECHAZADA,

        FaseFalloMikrotikSsh.CONEXION,

        true,

        duracionMs,

        cause,
      );
    }

    if (code === 'ENETUNREACH') {
      return this.connectionError(
        'La red del router no es alcanzable.',

        CodigoErrorMikrotikSsh.RED_INALCANZABLE,

        FaseFalloMikrotikSsh.CONEXION,

        true,

        duracionMs,

        cause,
      );
    }

    if (code === 'EHOSTUNREACH') {
      return this.connectionError(
        'El host MikroTik no es alcanzable.',

        CodigoErrorMikrotikSsh.HOST_INALCANZABLE,

        FaseFalloMikrotikSsh.CONEXION,

        true,

        duracionMs,

        cause,
      );
    }

    if (
      code === 'ETIMEDOUT' ||
      level?.includes('handshake-timeout') ||
      message.includes('timed out while waiting for handshake') ||
      message.includes('handshake timeout')
    ) {
      return this.connectionError(
        'La conexión SSH superó el tiempo máximo de handshake.',

        CodigoErrorMikrotikSsh.TIMEOUT_HANDSHAKE,

        FaseFalloMikrotikSsh.HANDSHAKE,

        true,

        duracionMs,

        cause,
      );
    }

    if (
      level?.includes('client-authentication') ||
      message.includes('authentication failed') ||
      message.includes('all configured authentication methods failed')
    ) {
      return this.connectionError(
        'El router rechazó las credenciales SSH.',

        CodigoErrorMikrotikSsh.AUTENTICACION_RECHAZADA,

        FaseFalloMikrotikSsh.AUTENTICACION,

        false,

        duracionMs,

        cause,
      );
    }

    if (
      message.includes('private key') ||
      message.includes('cannot parse privatekey') ||
      message.includes('encrypted private key detected')
    ) {
      return this.connectionError(
        'La clave privada SSH no pudo procesarse.',

        CodigoErrorMikrotikSsh.CLAVE_PRIVADA_INVALIDA,

        FaseFalloMikrotikSsh.AUTENTICACION,

        false,

        duracionMs,

        cause,
      );
    }

    return this.connectionError(
      'No pudo establecerse la sesión SSH con el router.',

      CodigoErrorMikrotikSsh.ERROR_DESCONOCIDO,

      FaseFalloMikrotikSsh.CONEXION,

      true,

      duracionMs,

      cause,
    );
  }

  private connectionError(
    message: string,
    codigo: CodigoErrorMikrotikSsh,
    fase: FaseFalloMikrotikSsh,
    reintentable: boolean,
    duracionMs: number,
    cause: unknown,
  ): MikrotikSshError {
    return new MikrotikSshError(message, {
      codigo,

      fase,

      efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

      reintentable,

      duracionMs,

      cause,
    });
  }

  private toConnectionError(cause: unknown): Ssh2ConnectionError {
    if (cause instanceof Error) {
      return cause as Ssh2ConnectionError;
    }

    return new Error('Error SSH no identificado.') as Ssh2ConnectionError;
  }

  private safeCloseClient(client: Client): void {
    try {
      client.end();
    } catch {
      /**
       * La conexión ya se encuentra fallida.
       */
    }
  }

  private assertRequiredString(
    value: string,
    field: string,
    maxLength: number,
  ): void {
    if (typeof value !== 'string' || value.length === 0) {
      throw this.configurationError(`${field} es obligatorio.`);
    }

    if (value.length > maxLength) {
      throw this.configurationError(
        `${field} supera la longitud máxima permitida.`,
      );
    }
  }

  private assertNoControlCharacters(value: string, field: string): void {
    if (/[\u0000-\u001F\u007F-\u009F]/u.test(value)) {
      throw this.configurationError(
        `${field} contiene caracteres de control no permitidos.`,
      );
    }
  }

  private configurationError(message: string): MikrotikSshError {
    return new MikrotikSshError(message, {
      codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

      fase: FaseFalloMikrotikSsh.CONFIGURACION,

      efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

      reintentable: false,
    });
  }
}
