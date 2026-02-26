import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RealTimeService } from '../app/real-time.service';
import { CreateRealTimeDto } from '../dto/create-real-time.dto';

@Controller('real-time')
export class RealTimeController {
  constructor(private readonly realTimeService: RealTimeService) {}

  @Get('last-locations')
  async getLocations() {
    return await this.realTimeService.getLastLocations();
  }

  @Patch('update-location')
  async updateLocation(@Body() dto: CreateRealTimeDto) {
    return await this.realTimeService.updateRealtimeLocation(dto);
  }
}
