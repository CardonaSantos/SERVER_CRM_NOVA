import { Module } from '@nestjs/common';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FacturaEliminacionService } from 'src/factura-eliminacion/factura-eliminacion.service';
import { GatewayModule } from 'src/web-sockets/websocket.module';

@Module({
  imports: [GatewayModule],
  controllers: [FacturacionController],
  providers: [FacturacionService, PrismaService, FacturaEliminacionService],
  exports: [FacturacionService], // 👈 exportas el servicio
})
export class FacturacionModule {}
