import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateRealTimeDto } from '../dto/create-real-time.dto';
import {
  REAL_TIME_LOCATION,
  RealTimeLocationRepository,
} from '../domain/real-time-location.repository';
import { WebSocketServices } from 'src/web-sockets/websocket.service';
import { RealTimeLocation } from '../entities/real-time.entity';

@Injectable()
export class RealTimeService {
  private readonly logger = new Logger(RealTimeService.name);

  constructor(
    @Inject(REAL_TIME_LOCATION)
    private readonly repo: RealTimeLocationRepository,

    private readonly wb: WebSocketServices,
  ) {}

  // RealTimeService
  async updateRealtimeLocation(dto: CreateRealTimeDto) {
    // ← Convertir DTO a entidad de dominio primero
    const entity = RealTimeLocation.create({
      usuarioId: dto.usuarioId,
      latitud: dto.latitud,
      longitud: dto.longitud,
      precision: dto.precision,
      velocidad: dto.velocidad,
      bateria: dto.bateria,
    });

    const locationDto = await this.repo.updateLocation(entity);

    await this.wb.emitRealTimeLocation({
      empresaId: 1,
      payload: locationDto,
    });

    return locationDto;
  }

  async getLastLocations() {
    return await this.repo.getLastLocations();
  }
}
