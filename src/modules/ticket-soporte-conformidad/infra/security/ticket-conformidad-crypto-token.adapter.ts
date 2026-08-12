import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  TicketConformidadGeneratedToken,
  TicketConformidadTokenPort,
} from '../../application/port/ticket-conformidad-token.port';

@Injectable()
export class TicketConformidadCryptoTokenAdapter
  implements TicketConformidadTokenPort
{
  private static readonly TOKEN_BYTES = 32;

  generate(): TicketConformidadGeneratedToken {
    const token = randomBytes(
      TicketConformidadCryptoTokenAdapter.TOKEN_BYTES,
    ).toString('base64url');

    return {
      token,
      tokenHash: this.hash(token),
    };
  }

  hash(token: string): string {
    const normalized = token?.trim();

    if (!normalized) {
      throw new Error('No se puede generar el hash de un token vacío.');
    }

    return createHash('sha256').update(normalized, 'utf8').digest('hex');
  }
}
