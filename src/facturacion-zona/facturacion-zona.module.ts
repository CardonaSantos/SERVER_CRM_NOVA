import { Module } from '@nestjs/common';
import { FacturacionZonaService } from './facturacion-zona.service';
import { FacturacionZonaController } from './facturacion-zona.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FacturacionZonaController],
  providers: [FacturacionZonaService, PrismaService],
})
export class FacturacionZonaModule {}
