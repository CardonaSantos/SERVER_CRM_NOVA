import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealTimeLocationRepository } from '../domain/real-time-location.repository';
import { UpdateRealTimeDto } from '../dto/update-real-time.dto';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { RealTimeLocation } from '../entities/real-time.entity';
import { PrismaRealTimeMapper } from '../common/realtime-location.mappers';
import { CreateRealTimeDto } from '../dto/create-real-time.dto';

@Injectable()
export class PrismaRealTimeLocation implements RealTimeLocationRepository {
  private readonly logger = new Logger(PrismaRealTimeLocation.name);
  constructor(private readonly prisma: PrismaService) {}

  async updateLocation(entity: RealTimeLocation): Promise<RealTimeLocation> {
    try {
      const result = await this.prisma.ubicacionActual.upsert({
        where: { usuarioId: entity.usuarioId },
        update: PrismaRealTimeMapper.toUpdate(entity),
        create: PrismaRealTimeMapper.toPersistence(entity),
      });

      const newLocation = await this.prisma.ubicacionActual.findUnique({
        where: {
          usuarioId: result.usuarioId,
        },
        include: {
          usuario: true,
        },
      });

      return PrismaRealTimeMapper.toDomain(newLocation);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaRealTimeLocation.updateLocation',
      );
    }
  }

  async getLastLocations(): Promise<RealTimeLocation[]> {
    try {
      const lastRecords = await this.prisma.ubicacionActual.findMany({
        include: {
          usuario: true,
        },
        orderBy: {
          actualizadoEn: 'desc',
        },
      });

      return (
        Array.isArray(lastRecords) &&
        lastRecords.map((r) => PrismaRealTimeMapper.toDomain(r))
      );
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaRealTimeLocation.updateLocation',
      );
    }
  }
}
