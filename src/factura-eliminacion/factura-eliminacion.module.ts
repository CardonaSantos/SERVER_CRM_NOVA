import { Module } from '@nestjs/common';
import { FacturaEliminacionService } from './factura-eliminacion.service';
import { FacturaEliminacionController } from './factura-eliminacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FacturaEliminacionController],
  providers: [FacturaEliminacionService, PrismaService],
})
export class FacturaEliminacionModule {}
