import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from 'src/twilio/twilio.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class GenerarFacturaService {
  private readonly logger = new Logger(GenerarFacturaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Funcion que toma datos para generar una factura individual
   * no tiene cron, solo es una llamada y devuelve la factura generada
   */
}
