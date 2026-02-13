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

      return PrismaRealTimeMapper.toDomain(result);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaRealTimeLocation.updateLocation',
      );
    }
  }
}
