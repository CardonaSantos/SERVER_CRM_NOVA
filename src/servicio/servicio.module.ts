import { Module } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { ServicioController } from './servicio.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServicioController],
  providers: [ServicioService, PrismaService],
})
export class ServicioModule {}
