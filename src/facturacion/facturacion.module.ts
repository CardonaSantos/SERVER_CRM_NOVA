import { Module } from '@nestjs/common';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FacturaEliminacionService } from 'src/factura-eliminacion/factura-eliminacion.service';

@Module({
  controllers: [FacturacionController],
  providers: [FacturacionService, PrismaService, FacturaEliminacionService],
})
export class FacturacionModule {}
