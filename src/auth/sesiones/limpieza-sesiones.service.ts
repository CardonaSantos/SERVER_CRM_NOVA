import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

const DIA_MS = 86_400_000;

/** Días que se guarda una sesión después de revocarse o vencer (G6). */
export const RETENCION_SESIONES_DIAS = 30;

/** Días que se guarda la bitácora de intentos de autenticación (G6). */
export const RETENCION_INTENTOS_AUTH_DIAS = 90;

export type ResultadoLimpiezaSesiones = {
  sesiones: number;
  intentos: number;
};

/**
 * Borra sesiones muertas (y sus refresh tokens, en cascada) e intentos de
 * autenticación viejos. Una sesión vigente nunca se toca: solo se borra la
 * que lleva más de 30 días revocada o vencida.
 */
@Injectable()
export class LimpiezaSesionesService {
  constructor(private readonly prisma: PrismaService) {}

  async limpiar(ahora: Date): Promise<ResultadoLimpiezaSesiones> {
    const corteSesiones = new Date(
      ahora.getTime() - RETENCION_SESIONES_DIAS * DIA_MS,
    );
    const corteIntentos = new Date(
      ahora.getTime() - RETENCION_INTENTOS_AUTH_DIAS * DIA_MS,
    );

    const sesiones = await this.prisma.sesionUsuario.deleteMany({
      where: {
        OR: [
          { revocadaEn: { lt: corteSesiones } },
          { expiraAbsolutaEn: { lt: corteSesiones } },
          { expiraInactividadEn: { lt: corteSesiones } },
        ],
      },
    });
    const intentos = await this.prisma.intentoAutenticacion.deleteMany({
      where: { creadoEn: { lt: corteIntentos } },
    });

    return { sesiones: sesiones.count, intentos: intentos.count };
  }
}
