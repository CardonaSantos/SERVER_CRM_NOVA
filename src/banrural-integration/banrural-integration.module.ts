import { Module } from '@nestjs/common';
import { BanruralIntegrationService } from './banrural-integration.service';
import { BanruralIntegrationController } from './banrural-integration.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FacturacionService } from 'src/facturacion/facturacion.service';
import { FacturaEliminacionService } from 'src/factura-eliminacion/factura-eliminacion.service';

@Module({
  controllers: [BanruralIntegrationController],
  providers: [
    BanruralIntegrationService,
    PrismaService,
    FacturacionService,
    FacturaEliminacionService,
  ],
})
export class BanruralIntegrationModule {}
