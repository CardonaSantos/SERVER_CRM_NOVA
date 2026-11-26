import { Injectable } from '@nestjs/common';

import { EstadoTrackingTecnico as PrismaEstadoTrackingTecnico } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking-repository.port';
import { TecnicoTrackingSesionEntity } from '../../domain/entities/tecnico-tracking-sesion.entity';
import { TecnicoTrackingSesionPrismaMapper } from './tecnico-tracking-sesion-prisma.mapper';

@Injectable()
export class TecnicoTrackingPrismaRepository
  implements TecnicoTrackingRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  // BUSQUEDA SESION

  async findSessionForTechnician(params: {
    tecnicoId: number;
    sesionTrackingId: number;
  }): Promise<TecnicoTrackingSesionEntity | null> {
    const record = await this.prisma.tecnicoTrackingSesion.findFirst({
      where: {
        id: params.sesionTrackingId,

        tecnicoId: params.tecnicoId,
      },
    });

    if (!record) {
      return null;
    }

    return TecnicoTrackingSesionPrismaMapper.toDomain(record);
  }

  // SESION ACTIVA DEL TECNICO

  async findActiveSessionByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingSesionEntity | null> {
    const record = await this.prisma.tecnicoTrackingSesion.findFirst({
      where: {
        tecnicoId,

        estado: PrismaEstadoTrackingTecnico.ACTIVA,
      },

      orderBy: {
        iniciadoEn: 'desc',
      },
    });

    if (!record) {
      return null;
    }

    return TecnicoTrackingSesionPrismaMapper.toDomain(record);
  }

  // BUSCAR SESIONES STALE

  async findActiveSessionsWithHeartbeatBefore(params: {
    before: Date;
    limit: number;
  }): Promise<TecnicoTrackingSesionEntity[]> {
    const records = await this.prisma.tecnicoTrackingSesion.findMany({
      where: {
        estado: PrismaEstadoTrackingTecnico.ACTIVA,

        ultimoHeartbeatEn: {
          lt: params.before,
        },
      },

      orderBy: {
        ultimoHeartbeatEn: 'asc',
      },

      take: params.limit,
    });

    return records.map((record) =>
      TecnicoTrackingSesionPrismaMapper.toDomain(record),
    );
  }
}
