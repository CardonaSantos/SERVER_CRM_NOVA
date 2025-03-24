import { Module } from '@nestjs/common';
import { ZonaFacturacionCronService } from './zona-facturacion-cron.service';
import { ZonaFacturacionCronController } from './zona-facturacion-cron.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ZonaFacturacionCronController],
  providers: [ZonaFacturacionCronService, PrismaService],
})
export class ZonaFacturacionCronModule {}
