import { Module } from '@nestjs/common';
import { ServicioInternetService } from './servicio-internet.service';
import { ServicioInternetController } from './servicio-internet.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServicioInternetController],
  providers: [ServicioInternetService, PrismaService],
})
export class ServicioInternetModule {}
