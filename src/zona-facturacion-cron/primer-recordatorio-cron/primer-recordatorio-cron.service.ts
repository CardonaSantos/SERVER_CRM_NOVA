import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from 'src/prisma/prisma.service';

import { TwilioService } from 'src/twilio/twilio.service';
import { ConfigService } from '@nestjs/config';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import {
  formatearTelefonos,
  shouldSkipClient,
  shouldSkipZoneToday,
} from '../Functions';
// Extiende dayjs con los plugins
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

@Injectable()
export class PrimerRecordatorioCronService {
  private readonly logger = new Logger(PrimerRecordatorioCronService.name);
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
    private readonly cloudApi: CloudApiMetaService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajePrimerRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturacion: Recordatorio 1');

    const TEMPLATE_NAME =
      this.configService.get<string>('RECORDATORIO_PAGO_1_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: RECORDATORIO_PAGO_1_PLANTILLA',
        );
      })();

    /** 1. Empresa para variable {{2}} */
    const empresa = await this.prisma.empresa.findFirst({
      select: { nombre: true },
    });

    if (!empresa) {
      this.logger.error('Empresa no encontrada; abortando cron.');
      return;
    }

    /** 2. Zonas y clientes */
    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaRecordatorio)) continue;

      // flags zona (mantengo tu lógica)
      if (!zona.enviarRecordatorio1 || !zona.enviarRecordatorio) continue;

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        // flag cliente (mantengo tu lógica)
        if (!cliente.enviarRecordatorio) {
          this.logger.debug(
            `Cliente ${cliente.id} tiene enviarRecordatorio=false; no se envía Recordatorio 1.`,
          );
          continue;
        }

        try {
          /** 3. Obtener / crear factura pendiente del periodo */
          const { factura } = await this.facturaManager.obtenerOcrearFactura(
            cliente,
            zona,
            false,
          );

          /** Si la factura ya está pagada, NO enviar recordatorio */
          if (
            !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
              factura.estadoFacturaInternet,
            )
          ) {
            this.logger.debug(
              `Factura ${factura.id} no está pendiente; se omite cliente ${cliente.id}.`,
            );
            continue;
          }

          /** 4. Variable {{3}}: mes/año en español */
          const mesFactura = dayjs(factura.fechaPagoEsperada)
            .tz('America/Guatemala')
            .locale('es')
            .format('MMMM YYYY')
            .toUpperCase();

          /** 5. Números válidos (Meta) */
          const destinos = formatearTelefonosMeta([
            cliente.telefono,
            // cliente.contactoReferenciaTelefono, //
          ]);

          const destinosUnicos = Array.from(new Set(destinos));

          if (destinosUnicos.length === 0) {
            this.logger.warn(
              `Cliente ${cliente.id} sin teléfonos válidos para Meta. Raw: "${cliente.telefono}"`,
            );
            continue;
          }

          /** 6. Variables (3) en orden */
          const variablesPlantilla = [
            `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
              'Nombre no disponible', // {{1}}
            empresa.nombre ?? 'Nova Sistemas S.A.', // {{2}}
            mesFactura, // {{3}}
          ];

          for (const tel of destinosUnicos) {
            const payload = this.cloudApi.crearPayloadTicket(
              tel,
              TEMPLATE_NAME,
              variablesPlantilla,
            );

            const resp = await this.cloudApi.enviarMensaje(payload);
            const msgId = resp?.messages?.[0]?.id;

            this.logger.log(
              `📨 Recordatorio 1 enviado a ${tel} (cliente ${cliente.id})${
                msgId ? ` (msgId: ${msgId})` : ''
              }`,
            );
          }
        } catch (err: any) {
          if (err instanceof NotFoundException) {
            this.logger.debug(
              `Sin factura para cliente ${cliente.id}; no se envía recordatorio.`,
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
