import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealTimeLocationRepository } from '../domain/real-time-location.repository';
import { UpdateRealTimeDto } from '../dto/update-real-time.dto';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { RealTimeLocation } from '../entities/real-time.entity';
import { PrismaRealTimeMapper } from '../common/realtime-location.mappers';
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

import { TZ } from 'src/Utils/tzgt';
import { RealTimeLocationMapDto } from '../dto/dto-shape';

@Injectable()
export class PrismaRealTimeLocation implements RealTimeLocationRepository {
  private readonly logger = new Logger(PrismaRealTimeLocation.name);
  constructor(private readonly prisma: PrismaService) {}

  // En PrismaRealTimeLocation
  async updateLocation(
    entity: RealTimeLocation,
  ): Promise<RealTimeLocationMapDto> {
    await this.prisma.ubicacionActual.upsert({
      where: { usuarioId: entity.usuarioId },
      update: PrismaRealTimeMapper.toUpdate(entity),
      create: PrismaRealTimeMapper.toPersistence(entity),
    });

    const newLocation = await this.prisma.ubicacionActual.findUnique({
      where: { usuarioId: entity.usuarioId },
      select: {
        usuarioId: true,
        latitud: true,
        longitud: true,
        precision: true,
        velocidad: true,
        bateria: true,
        actualizadoEn: true,
        usuario: {
          select: {
            nombre: true,
            rol: true,
            telefono: true,
            perfil: {
              select: { avatarUrl: true },
            },
            ticketsAsignados: {
              select: { id: true, titulo: true },
              where: { estado: 'EN_PROCESO' },
            },
          },
        },
      },
    });

    return this.toMapDto(newLocation); // ← retorna el DTO limpio directamente
  }

  async getLastLocations(): Promise<RealTimeLocationMapDto[]> {
    try {
      const ultima_hora = dayjs().tz(TZ).subtract(1, 'hour');
      const lastRecords = await this.prisma.ubicacionActual.findMany({
        orderBy: { actualizadoEn: 'desc' },
        where: {
          actualizadoEn: {
            gte: ultima_hora.toDate(),
          },
        },
        select: {
          usuarioId: true,
          latitud: true,
          longitud: true,
          bateria: true,
          velocidad: true,
          actualizadoEn: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              rol: true,
              telefono: true,
              perfil: {
                select: {
                  avatarUrl: true,
                },
              },
              ticketsAsignados: {
                select: {
                  id: true,
                  titulo: true,
                },
                where: {
                  estado: 'EN_PROCESO',
                },
              },
            },
          },
        },
      });

      return lastRecords.map((r) => this.toMapDto(r));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaRealTimeLocation.updateLocation',
      );
    }
  }

  private toMapDto(raw: any): RealTimeLocationMapDto {
    return {
      usuario: {
        nombre: raw.usuario?.nombre ?? '',
        rol: raw.usuario?.rol,
        telefono: raw.usuario?.telefono,
        avatarUrl: raw.usuario?.perfil?.avatarUrl,
      },
      precision: raw?.precision,
      usuarioId: raw.usuarioId,
      latitud: raw.latitud,
      longitud: raw.longitud,
      bateria: raw?.bateria,
      velocidad: raw?.velocidad,
      actualizadoEn: raw.actualizadoEn,
      ticketsEnProceso:
        raw.usuario?.ticketsAsignados?.map((t) => ({
          id: t.id,
          titulo: t.titulo,
        })) ?? [],
    };
  }
}
