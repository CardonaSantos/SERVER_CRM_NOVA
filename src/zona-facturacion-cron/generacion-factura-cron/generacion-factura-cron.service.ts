import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TwilioService } from 'src/twilio/twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { getEstadoCliente, PENDIENTES_ENUM } from '../utils';
import {
  ClienteInternet,
  // EstadoCliente,
  FacturaInternet,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  formatearTelefonos,
  shouldSkipClient,
  shouldSkipZoneToday,
} from '../Functions';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
// CONFIG DE DAYJS
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

@Injectable()
export class GeneracionFacturaCronService {
  private readonly logger = new Logger(GeneracionFacturaCronService.name);
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
    private readonly cloudApi: CloudApiMetaService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS, {
  //   timeZone: 'America/Guatemala',
  // }) //comentado
  // @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  @Cron('0 15 * * *', { timeZone: 'America/Guatemala' })
  async gerarFacturacionAutomaticaCron() {
    const TEMPLATE_NAME =
      this.configService.get<string>('GENERACION_FACTURA_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: GENERACION_FACTURA_PLANTILLA',
        );
      })();

    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaGeneracionFactura)) continue;

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        if (!cliente.enviarRecordatorio) {
          this.logger.debug(
            `Cliente ${cliente.id} tiene enviarRecordatorio=false; no se envía notificación de factura.`,
          );
          continue;
        }

        try {
          const { factura, esNueva, notificar } =
            await this.facturaManager.CrearFacturaCronMain(cliente, zona);

          if (notificar) {
            await this.enviarWhatsAppFacturaMeta(
              cliente,
              factura,
              TEMPLATE_NAME,
            );
          } else {
            this.logger.debug(
              `Factura ${factura.id} ya pagada; no se envía notificación.`,
            );
          }

          if (esNueva) await this.actualizarEstadoCliente(factura);
        } catch (err: any) {
          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err?.message ?? err}`,
          );
        }
      }
    }
  }

  private async enviarWhatsAppFacturaMeta(
    cliente: ClienteInternet,
    factura: FacturaInternet,
    templateName: string,
  ): Promise<void> {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: cliente.empresaId },
      select: { nombre: true },
    });

    const mesFactura = dayjs(factura.fechaPagoEsperada)
      .tz('America/Guatemala')
      .format('MMMM YYYY')
      .toUpperCase();

    const telefonos = formatearTelefonosMeta([cliente.telefono]);
    const destinosUnicos = Array.from(new Set(telefonos));

    if (destinosUnicos.length === 0) {
      this.logger.warn(
        `Cliente ${cliente.id} sin teléfono válido para Meta. Raw: "${cliente.telefono}"`,
      );
      return;
    }

    const variablesPlantilla = [
      `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
        'Nombre no disponible', // {{1}}
      empresa?.nombre ?? 'Nova Sistemas S.A.', // {{2}}
      mesFactura, // {{3}}
    ];

    for (const tel of destinosUnicos) {
      const payload = this.cloudApi.crearPayloadTicket(
        tel,
        templateName,
        variablesPlantilla,
      );

      const resp = await this.cloudApi.enviarMensaje(payload);
      const msgId = resp?.messages?.[0]?.id;

      this.logger.log(
        `Factura notificada a ${tel}${msgId ? ` (msgId: ${msgId})` : ''}`,
      );
    }
  }

  private async actualizarEstadoCliente(
    factura: FacturaInternet,
  ): Promise<void> {
    const pendientes = await this.prisma.facturaInternet.count({
      where: {
        clienteId: factura.clienteId,
        estadoFacturaInternet: { in: PENDIENTES_ENUM },
      },
    });

    await this.prisma.clienteInternet.update({
      where: { id: factura.clienteId },
      data: { estadoCliente: getEstadoCliente(pendientes) },
    });
  }
}
