import { Module } from '@nestjs/common';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FacturacionController],
  providers: [FacturacionService, PrismaService],
})
export class FacturacionModule {}
