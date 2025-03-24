import { Module } from '@nestjs/common';
import { TipoServicioService } from './tipo-servicio.service';
import { TipoServicioController } from './tipo-servicio.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TipoServicioController],
  providers: [TipoServicioService, PrismaService],
})
export class TipoServicioModule {}
