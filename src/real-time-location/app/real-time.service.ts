import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateRealTimeDto } from '../dto/create-real-time.dto';
import {
  REAL_TIME_LOCATION,
  RealTimeLocationRepository,
} from '../domain/real-time-location.repository';
import { WebSocketServices } from 'src/web-sockets/websocket.service';

@Injectable()
export class RealTimeService {
  private readonly logger = new Logger(RealTimeService.name);

  constructor(
    @Inject(REAL_TIME_LOCATION)
    private readonly repo: RealTimeLocationRepository,

    private readonly wb: WebSocketServices,
  ) {}

  async updateRealtimeLocation(dto: CreateRealTimeDto) {
    const locationUpdated = await this.repo.updateLocation(dto);

    const dtoWb = {
      empresaId: 1,
      payload: locationUpdated,
    };

    await this.wb.emitRealTimeLocation(dtoWb);

    return locationUpdated;
  }

  async getLastLocations() {
    return await this.repo.getLastLocations();
  }
}
