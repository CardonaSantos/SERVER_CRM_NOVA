import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateRealTimeDto } from '../dto/create-real-time.dto';
import { UpdateRealTimeDto } from '../dto/update-real-time.dto';
import {
  REAL_TIME_LOCATION,
  RealTimeLocationRepository,
} from '../domain/real-time-location.repository';

@Injectable()
export class RealTimeService {
  private readonly logger = new Logger(RealTimeService.name);

  constructor(
    @Inject(REAL_TIME_LOCATION)
    private readonly repo: RealTimeLocationRepository,
  ) {}

  async updateRealtimeLocation(dto: CreateRealTimeDto) {
    return await this.repo.updateLocation(dto);
  }
}
