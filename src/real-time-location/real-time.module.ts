import { Module } from '@nestjs/common';
import { RealTimeService } from './app/real-time.service';
import { RealTimeController } from './presentation/real-time.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { REAL_TIME_LOCATION } from './domain/real-time-location.repository';
import { PrismaRealTimeLocation } from './infraestructure/prisma-real-time-location.repository';
import { GatewayModule } from 'src/web-sockets/websocket.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [RealTimeController],
  providers: [
    RealTimeService,
    {
      provide: REAL_TIME_LOCATION,
      useClass: PrismaRealTimeLocation,
    },
  ],
})
export class RealTimeModule {}
