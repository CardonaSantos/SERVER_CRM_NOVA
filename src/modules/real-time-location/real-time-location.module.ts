import { Module } from '@nestjs/common';
import { RealTimeLocationService } from './application/services/real-time-location.service';
import { RealTimeLocationController } from './presentation/controllers/real-time-location.controller';

@Module({
  controllers: [RealTimeLocationController],
  providers: [RealTimeLocationService],
})
export class RealTimeLocationModule {}
