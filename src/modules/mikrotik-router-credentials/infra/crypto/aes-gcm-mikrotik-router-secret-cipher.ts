import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { MikrotikRouterSecretCipherPort } from '../../application/ports/mikrotik-router-secret-cipher.port';

type MikrotikRouterSecretEnvelope = {
  formato: 'MIKROTIK_ROUTER_AES_GCM';

  versionFormato: 1;

  versionClave: number;

  ciphertext: string;

  iv: string;

  authTag: string;
};

@Injectable()
export class AesGcmMikrotikRouterSecretCipher
  implements MikrotikRouterSecretCipherPort
{
  private static readonly ALGORITHM = 'aes-256-gcm';

  private static readonly IV_LENGTH = 12;

  private static readonly AUTH_TAG_LENGTH = 16;

  private static readonly FORMAT = 'MIKROTIK_ROUTER_AES_GCM';

  private static readonly FORMAT_VERSION = 1;

  constructor(private readonly configService: ConfigService) {}

  async encrypt(password: string): Promise<string> {
    const normalizedPassword = this.normalizePlainPassword(password);

    const versionClave = this.getActiveKeyVersion();

    const key = this.getKey(versionClave);

    const iv = randomBytes(AesGcmMikrotikRouterSecretCipher.IV_LENGTH);

    const cipher = createCipheriv(
      AesGcmMikrotikRouterSecretCipher.ALGORITHM,
      key,
      iv,
      {
        authTagLength: AesGcmMikrotikRouterSecretCipher.AUTH_TAG_LENGTH,
      },
    );

    const encrypted = Buffer.concat([
      cipher.update(normalizedPassword, 'utf8'),

      cipher.final(),
    ]);

    const envelope: MikrotikRouterSecretEnvelope = {
      formato: AesGcmMikrotikRouterSecretCipher.FORMAT,

      versionFormato: AesGcmMikrotikRouterSecretCipher.FORMAT_VERSION,

      versionClave,

      ciphertext: encrypted.toString('base64'),

      iv: iv.toString('base64'),

      authTag: cipher.getAuthTag().toString('base64'),
    };

    return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
  }

  async decrypt(passwordEnc: string): Promise<string> {
    const envelope = this.decodeEnvelope(passwordEnc);

    const key = this.getKey(envelope.versionClave);

    const encrypted = this.decodeBase64(envelope.ciphertext, 'ciphertext');

    const iv = this.decodeBase64(envelope.iv, 'iv');

    const authTag = this.decodeBase64(envelope.authTag, 'authTag');

    if (iv.length !== AesGcmMikrotikRouterSecretCipher.IV_LENGTH) {
      throw new Error(
        'El IV de la credencial MikroTik no tiene una longitud válida.',
      );
    }

    if (authTag.length !== AesGcmMikrotikRouterSecretCipher.AUTH_TAG_LENGTH) {
      throw new Error(
        'El auth tag de la credencial MikroTik no tiene una longitud válida.',
      );
    }

    try {
      const decipher = createDecipheriv(
        AesGcmMikrotikRouterSecretCipher.ALGORITHM,
        key,
        iv,
        {
          authTagLength: AesGcmMikrotikRouterSecretCipher.AUTH_TAG_LENGTH,
        },
      );

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),

        decipher.final(),
      ]);

      const password = decrypted.toString('utf8');

      return this.normalizePlainPassword(password);
    } catch {
      throw new Error(
        'No fue posible descifrar la credencial administrativa del router MikroTik.',
      );
    }
  }

  private decodeEnvelope(passwordEnc: string): MikrotikRouterSecretEnvelope {
    const encoded = passwordEnc?.trim();

    if (!encoded) {
      throw new Error(
        'La credencial cifrada del router MikroTik es obligatoria.',
      );
    }

    try {
      const serialized = this.decodeBase64(encoded, 'passwordEnc').toString(
        'utf8',
      );

      const parsed = JSON.parse(serialized) as unknown;

      this.assertEnvelope(parsed);

      return parsed;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('La credencial')) {
        throw error;
      }

      throw new Error(
        'La credencial cifrada del router MikroTik tiene un formato inválido.',
      );
    }
  }

  private assertEnvelope(
    value: unknown,
  ): asserts value is MikrotikRouterSecretEnvelope {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(
        'La credencial cifrada del router MikroTik no contiene un sobre válido.',
      );
    }

    const envelope = value as Record<string, unknown>;

    if (envelope.formato !== AesGcmMikrotikRouterSecretCipher.FORMAT) {
      throw new Error(
        'La credencial cifrada del router MikroTik utiliza un formato no soportado.',
      );
    }

    if (
      envelope.versionFormato !==
      AesGcmMikrotikRouterSecretCipher.FORMAT_VERSION
    ) {
      throw new Error(
        'La versión del formato de la credencial MikroTik no es compatible.',
      );
    }

    if (
      !Number.isInteger(envelope.versionClave) ||
      Number(envelope.versionClave) <= 0
    ) {
      throw new Error(
        'La versión de clave de la credencial MikroTik no es válida.',
      );
    }

    this.assertRequiredString(envelope.ciphertext, 'ciphertext');

    this.assertRequiredString(envelope.iv, 'iv');

    this.assertRequiredString(envelope.authTag, 'authTag');
  }

  private getActiveKeyVersion(): number {
    const rawVersion =
      this.configService.get<string>(
        'MIKROTIK_ROUTER_SECRET_ACTIVE_KEY_VERSION',
      ) ?? '1';

    const version = Number(rawVersion);

    if (!Number.isInteger(version) || version <= 0) {
      throw new Error(
        'MIKROTIK_ROUTER_SECRET_ACTIVE_KEY_VERSION debe ser un entero positivo.',
      );
    }

    return version;
  }

  private getKey(version: number): Buffer {
    if (!Number.isInteger(version) || version <= 0) {
      throw new Error('La versión de clave MikroTik no es válida.');
    }

    const variableName = `MIKROTIK_ROUTER_SECRET_KEY_V${version}`;

    const encodedKey = this.configService.get<string>(variableName);

    if (!encodedKey) {
      throw new Error(
        `No se encontró la clave MikroTik correspondiente a la versión ${version}.`,
      );
    }

    const key = this.decodeBase64(encodedKey, variableName);

    if (key.length !== 32) {
      throw new Error(
        `${variableName} debe contener exactamente 32 bytes codificados en Base64.`,
      );
    }

    return key;
  }

  private normalizePlainPassword(value: string): string {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(
        'La contraseña administrativa del router MikroTik es obligatoria.',
      );
    }

    if (value.length > 1_000) {
      throw new Error(
        'La contraseña administrativa del router MikroTik supera la longitud permitida.',
      );
    }

    /**
     * No usamos trim().
     *
     * Una contraseña puede contener espacios al inicio
     * o al final y deben conservarse exactamente.
     */
    return value;
  }

  private decodeBase64(value: string, field: string): Buffer {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    if (
      normalized.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)
    ) {
      throw new Error(`${field} no contiene un valor Base64 válido.`);
    }

    return Buffer.from(normalized, 'base64');
  }

  private assertRequiredString(
    value: unknown,
    field: string,
  ): asserts value is string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${field} es obligatorio.`);
    }
  }
}
