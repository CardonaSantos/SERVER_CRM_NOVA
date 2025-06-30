import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TwilioService } from 'src/twilio/twilio.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { DatosFacturaGenerate, DatosFacturaGenerateIndividual } from '../utils';
import { EstadoCliente } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { periodoFrom } from 'src/facturacion/Utils';
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
