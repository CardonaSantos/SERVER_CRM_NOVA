import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'src/twilio/twilio.service';
// import { GenerarFacturaService } from '../generar-factura/generar-factura.service';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import {
  formatearTelefonos,
  shouldSkipClient,
  shouldSkipZoneToday,
} from '../Functions';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
dayjs.extend(utc);
dayjs.extend(timezone);
@Injectable()
export class RecordatorioDiaPagoService {
  private readonly logger = new Logger(RecordatorioDiaPagoService.name);

  constructor(
    private readonly twilioService: TwilioService,

    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    // private readonly generarFactura: GenerarFacturaService,
    private readonly facturaManager: FacturaManagerService,
    private readonly cloudApi: CloudApiMetaService,
  ) {}
  // @Cron(CronExpression.EVERY_10_SECONDS)
  // @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  @Cron('0 15 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajeDiaPago(): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Día de pago');

    const TEMPLATE_NAME =
      this.configService.get<string>('RECORDATORIO_DIA_PAGO_1_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: RECORDATORIO_DIA_PAGO_1_PLANTILLA',
        );
      })();

    const empresa = await this.prisma.empresa.findFirst({
      select: { nombre: true },
    });
    if (!empresa) {
      this.logger.error('Empresa no encontrada; abortando cron.');
      return;
    }

    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaPago)) continue;

      if (!(zona.enviarRecordatorio && zona.diaPago)) continue;

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;
        if (!cliente.enviarRecordatorio) continue;

        try {
          const { factura } = await this.facturaManager.obtenerOcrearFactura(
            cliente,
            zona,
            false,
          );

          if (
            !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
              factura.estadoFacturaInternet,
            )
          ) {
            continue;
          }

          const mesFactura = dayjs(factura.fechaPagoEsperada)
            .tz('America/Guatemala')
            .locale('es')
            .format('MMMM YYYY')
            .toUpperCase();

          const destinos = Array.from(
            new Set(formatearTelefonosMeta([cliente.telefono])),
          );
          if (destinos.length === 0) continue;

          const variablesPlantilla = [
            `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
              'Nombre no disponible', // {{1}}
            empresa.nombre ?? 'Nova Sistemas S.A.', // {{2}}
            mesFactura, // {{3}}
          ];

          for (const tel of destinos) {
            const payload = this.cloudApi.crearPayloadTicket(
              tel,
              TEMPLATE_NAME,
              variablesPlantilla,
            );
            const resp = await this.cloudApi.enviarMensaje(payload);
            const msgId = resp?.messages?.[0]?.id;

            this.logger.log(
              `📨 Día de pago enviado a ${tel} (cliente ${cliente.id})${msgId ? ` (msgId: ${msgId})` : ''}`,
            );
          }
        } catch (err: any) {
          if (err instanceof NotFoundException) {
            this.logger.debug(
              `Sin factura para cliente ${cliente.id}; no se envía.`,
            );
            continue;
          }
          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err?.message ?? err}`,
          );
        }
      }
    }
  }
}
// generarMensajeDiaDePago
