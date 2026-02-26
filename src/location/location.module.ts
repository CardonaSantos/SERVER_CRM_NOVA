import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealTimeModule } from 'src/real-time-location/real-time.module';

@Module({
  controllers: [LocationController],
  providers: [LocationService, PrismaService],
  imports: [RealTimeModule],
})
export class LocationModule {}
