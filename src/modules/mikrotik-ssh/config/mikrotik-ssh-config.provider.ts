import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfiguracionMikrotikSsh } from '../domain/props/mikrotik-ssh-config.props';
import { MIKROTIK_SSH_CONFIG } from '../infra/tokens/mikrotik-ssh-config.token';

export const mikrotikSshConfigProvider: Provider = {
  provide: MIKROTIK_SSH_CONFIG,

  inject: [ConfigService],

  useFactory: (configService: ConfigService): ConfiguracionMikrotikSsh => {
    const readyTimeoutMs = readInteger(
      configService,
      'MIKROTIK_SSH_READY_TIMEOUT_MS',
      10_000,
      1_000,
      120_000,
    );

    const commandTimeoutMs = readInteger(
      configService,
      'MIKROTIK_SSH_COMMAND_TIMEOUT_MS',
      10_000,
      1_000,
      120_000,
    );

    const closeTimeoutMs = readInteger(
      configService,
      'MIKROTIK_SSH_CLOSE_TIMEOUT_MS',
      3_000,
      500,
      30_000,
    );

    const keepaliveIntervalMs = readInteger(
      configService,
      'MIKROTIK_SSH_KEEPALIVE_INTERVAL_MS',
      5_000,
      0,
      60_000,
    );

    const keepaliveCountMax = readInteger(
      configService,
      'MIKROTIK_SSH_KEEPALIVE_COUNT_MAX',
      3,
      1,
      20,
    );

    const maxOutputBytes = readInteger(
      configService,
      'MIKROTIK_SSH_MAX_OUTPUT_BYTES',
      65_536,
      1_024,
      1_048_576,
    );

    const permitirHostNoVerificado = readBoolean(
      configService,
      'MIKROTIK_SSH_ALLOW_UNVERIFIED_HOST',
      false,
    );

    return Object.freeze({
      readyTimeoutMs,

      commandTimeoutMs,

      closeTimeoutMs,

      keepaliveIntervalMs,

      keepaliveCountMax,

      maxOutputBytes,

      permitirHostNoVerificado,
    });
  },
};

function readInteger(
  configService: ConfigService,
  key: string,
  defaultValue: number,
  min: number,
  max: number,
): number {
  const rawValue = configService.get<string | number>(key);

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${key} debe ser un entero entre ${min} y ${max}.`);
  }

  return value;
}

function readBoolean(
  configService: ConfigService,
  key: string,
  defaultValue: boolean,
): boolean {
  const rawValue = configService.get<string | boolean>(key);

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  if (typeof rawValue === 'boolean') {
    return rawValue;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  throw new Error(`${key} debe ser true, false, 1 o 0.`);
}
