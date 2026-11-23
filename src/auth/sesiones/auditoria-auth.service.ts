import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { hashSha256 } from './token-opaco';

export type TipoIntento = 'LOGIN' | 'REFRESH' | 'REAUTENTICACION';

export interface ContextoCliente {
  ip?: string | null;
  userAgent?: string | null;
}

export interface IntentoAuth extends ContextoCliente {
  tipo: TipoIntento;
  exitoso: boolean;
  usuarioId?: number | null;
  /** En claro solo en memoria: se guarda su hash. */
  correo?: string | null;
  motivo?: string | null;
}

/**
 * Bitácora de intentos de autenticación (tabla IntentoAutenticacion).
 * Nunca guarda correos ni tokens en claro. Escribir la bitácora nunca
 * bloquea ni hace fallar el flujo de autenticación.
 */
@Injectable()
export class AuditoriaAuthService {
  private readonly logger = new Logger(AuditoriaAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  registrar(intento: IntentoAuth): void {
    const correo =
      typeof intento.correo === 'string' && intento.correo.trim()
        ? hashSha256(intento.correo.trim().toLowerCase())
        : null;

    this.prisma.intentoAutenticacion
      .create({
        data: {
          tipo: intento.tipo,
          exitoso: intento.exitoso,
          usuarioId: intento.usuarioId ?? null,
          correoHash: correo,
          motivo: intento.motivo ?? null,
          ip: intento.ip ?? null,
          userAgent: intento.userAgent ?? null,
        },
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `No se pudo registrar el intento de autenticación: ${
            error instanceof Error ? error.message : 'error desconocido'
          }`,
        );
      });
  }
}
