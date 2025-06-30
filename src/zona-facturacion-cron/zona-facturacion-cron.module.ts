import { Module } from '@nestjs/common';
import { ZonaFacturacionCronService } from './zona-facturacion-cron.service';
import { ZonaFacturacionCronController } from './zona-facturacion-cron.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { GeneracionFacturaCronService } from './generacion-factura-cron/generacion-factura-cron.service';
// import { MiServicioService } from './mi-servicio/mi-servicio.service';
// import { GeneracionFacturaCronService } from './generacion-factura-cron/generacion-factura-cron.service';
import { PrimerRecordatorioCronService } from './primer-recordatorio-cron/primer-recordatorio-cron.service';
import { SegundoRecordatorioCronService } from './segundo-recordatorio-cron/segundo-recordatorio-cron.service';
import { RecordatorioDiaPagoService } from './recordatorio-dia-pago/recordatorio-dia-pago.service';
// import { GenerarFacturaService } from './generar-factura/generar-factura.service';
import { FacturaManagerService } from './factura-manager/factura-manager.service';

@Module({
  controllers: [ZonaFacturacionCronController],
  providers: [
    ZonaFacturacionCronService,
    PrismaService,
    TwilioService,
    GeneracionFacturaCronService,
    PrimerRecordatorioCronService,
    SegundoRecordatorioCronService,
    RecordatorioDiaPagoService,
    // GenerarFacturaService, ya no sirve
    FacturaManagerService,
  ],
})
export class ZonaFacturacionCronModule {}
