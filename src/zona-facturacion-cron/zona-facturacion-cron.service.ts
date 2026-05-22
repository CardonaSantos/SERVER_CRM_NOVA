import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';

import { PrimerRecordatorioCronService } from './primer-recordatorio-cron/primer-recordatorio-cron.service';
import { SegundoRecordatorioCronService } from './segundo-recordatorio-cron/segundo-recordatorio-cron.service';
import { RecordatorioDiaPagoService } from './recordatorio-dia-pago/recordatorio-dia-pago.service';

@Injectable()
export class ZonaFacturacionCronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    //SERVICIO DE RECORDATORIOS
    private readonly primerRecordatorio: PrimerRecordatorioCronService,
    private readonly segundoRecordatorio: SegundoRecordatorioCronService,
    private readonly diaPagoService: RecordatorioDiaPagoService,
  ) {
    // LLAMO A TODOS LOS CRONS SIN TENER QUE LLAMAR A SUS METODOS YA SE EJECUTAN POR ELLOS MISMOS
  }
}
