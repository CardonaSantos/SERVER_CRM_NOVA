import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { RealTimeService } from '../app/real-time.service';
import { CreateRealTimeDto } from '../dto/create-real-time.dto';

@Controller('real-time')
export class RealTimeController {
  private readonly logger = new Logger(RealTimeController.name);
  constructor(private readonly realTimeService: RealTimeService) {}

  @Get('last-locations')
  async getLocations() {
    return await this.realTimeService.getLastLocations();
  }

  // @Patch('update-location')
  @Post('update-location')
  async updateLocation(@Body() dto: CreateRealTimeDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
    return await this.realTimeService.updateRealtimeLocation(dto);
  }
}
