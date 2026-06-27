import { Module } from '@nestjs/common';
import { ZonaFacturacionCronService } from './zona-facturacion-cron.service';
import { ZonaFacturacionCronController } from './zona-facturacion-cron.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeneracionFacturaCronService } from './1_generacion-factura-cron/generacion-factura-cron.service';
import { PrimerRecordatorioCronService } from './2_primer-recordatorio-cron/primer-recordatorio-cron.service';
import { SegundoRecordatorioCronService } from './3_segundo-recordatorio-cron/segundo-recordatorio-cron.service';
import { RecordatorioDiaPagoService } from './4_recordatorio-dia-pago/recordatorio-dia-pago.service';
import { FacturacionUtilitiesService } from './utilities/factura-manager.service';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  imports: [HttpModule, ConfigModule, NotificacionesModule],
  controllers: [ZonaFacturacionCronController],
  providers: [
    CloudApiMetaService,
    ZonaFacturacionCronService,
    PrismaService,
    GeneracionFacturaCronService,
    PrimerRecordatorioCronService,
    SegundoRecordatorioCronService,
    RecordatorioDiaPagoService,
    FacturacionUtilitiesService,
  ],
})
export class ZonaFacturacionCronModule {}
