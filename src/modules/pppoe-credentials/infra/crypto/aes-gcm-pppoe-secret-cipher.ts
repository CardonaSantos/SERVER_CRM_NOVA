import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import {
  PppoeSecretCipherPort,
  SecretoPppoeProtegido,
} from '../../application/ports/pppoe-secret-cipher.port';

@Injectable()
export class AesGcmPppoeSecretCipher implements PppoeSecretCipherPort {
  private static readonly ALGORITHM = 'aes-256-gcm';

  /**
   * Para AES-GCM se recomienda un IV de 12 bytes.
   */
  private static readonly IV_LENGTH = 12;

  private static readonly AUTH_TAG_LENGTH = 16;

  constructor(private readonly configService: ConfigService) {}

  async encrypt(secretoPlano: string): Promise<SecretoPppoeProtegido> {
    const normalizedSecret = this.normalizePlainSecret(secretoPlano);

    const versionClave = this.getActiveKeyVersion();

    const key = this.getKey(versionClave);

    const iv = randomBytes(AesGcmPppoeSecretCipher.IV_LENGTH);

    const cipher = createCipheriv(AesGcmPppoeSecretCipher.ALGORITHM, key, iv, {
      authTagLength: AesGcmPppoeSecretCipher.AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(normalizedSecret, 'utf8'),

      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      secretoCifrado: encrypted.toString('base64'),

      secretoIv: iv.toString('base64'),

      secretoAuthTag: authTag.toString('base64'),

      versionClave,
    };
  }

  async decrypt(secreto: SecretoPppoeProtegido): Promise<string> {
    this.assertProtectedSecret(secreto);

    const key = this.getKey(secreto.versionClave);

    const encrypted = this.decodeBase64(
      secreto.secretoCifrado,
      'secretoCifrado',
    );

    const iv = this.decodeBase64(secreto.secretoIv, 'secretoIv');

    const authTag = this.decodeBase64(secreto.secretoAuthTag, 'secretoAuthTag');

    if (iv.length !== AesGcmPppoeSecretCipher.IV_LENGTH) {
      throw new Error('El IV del secreto PPPoE no tiene una longitud válida.');
    }

    if (authTag.length !== AesGcmPppoeSecretCipher.AUTH_TAG_LENGTH) {
      throw new Error(
        'El auth tag del secreto PPPoE no tiene una longitud válida.',
      );
    }

    try {
      const decipher = createDecipheriv(
        AesGcmPppoeSecretCipher.ALGORITHM,
        key,
        iv,
        {
          authTagLength: AesGcmPppoeSecretCipher.AUTH_TAG_LENGTH,
        },
      );

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      throw new Error('No fue posible descifrar el secreto PPPoE.');
    }
  }

  private getActiveKeyVersion(): number {
    const rawVersion =
      this.configService.get<string>('PPPOE_SECRET_ACTIVE_KEY_VERSION') ?? '1';

    const version = Number(rawVersion);

    if (!Number.isInteger(version) || version <= 0) {
      throw new Error(
        'PPPOE_SECRET_ACTIVE_KEY_VERSION debe ser un entero positivo.',
      );
    }

    return version;
  }

  private getKey(version: number): Buffer {
    if (!Number.isInteger(version) || version <= 0) {
      throw new Error('La versión de clave PPPoE no es válida.');
    }

    const variableName = `PPPOE_SECRET_KEY_V${version}`;

    const encodedKey = this.configService.get<string>(variableName);

    if (!encodedKey) {
      throw new Error(
        `No se encontró la clave PPPoE correspondiente a la versión ${version}.`,
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

  private normalizePlainSecret(value: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error('El secreto PPPoE en texto plano es obligatorio.');
    }

    return normalized;
  }

  private assertProtectedSecret(value: SecretoPppoeProtegido): void {
    if (!value) {
      throw new Error('El secreto PPPoE protegido es obligatorio.');
    }

    if (!Number.isInteger(value.versionClave) || value.versionClave <= 0) {
      throw new Error('La versión de clave PPPoE no es válida.');
    }
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
}
