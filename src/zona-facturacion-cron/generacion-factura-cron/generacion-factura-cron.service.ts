import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TwilioService } from 'src/twilio/twilio.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
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
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class GeneracionFacturaCronService {
  private readonly logger = new Logger(GeneracionFacturaCronService.name);
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
  ) {}
  /**
   * Genera la facturación automática para los clientes.
   * Este método se ejecuta diariamente a las 11 PM (hora de Guatemala).
   * Revisa las zonas de facturación y genera facturas para los clientes o llama inmediatamente
   * al método `generarFacturaClientePorZona` para generar una a un cliente.
   */

  // @Cron(CronExpression.EVERY_10_SECONDS, {
  //   timeZone: 'America/Guatemala',
  // })
  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' }) // ⏰ 10:00 AM GT
  async gerarFacturacionAutomaticaCron() {
    // const hoy = dayjs().tz('America/Guatemala');
    const TEMPLATE_SID =
      this.configService.get<string>('GENERACION_FACTURA_1_SID') ??
      (() => {
        throw new InternalServerErrorException('SID plantilla faltante');
      })();

    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaGeneracionFactura)) continue;

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        try {
          /** Crear o recuperar la factura */
          const { factura, esNueva, notificar } =
            await this.facturaManager.CrearFacturaCronMain(cliente, zona);

          /** Notificación: solo si corresponde */
          if (notificar) {
            await this.enviarWhatsAppFactura(cliente, factura, TEMPLATE_SID);
          } else {
            this.logger.debug(
              `Factura ${factura.id} ya pagada; no se envía notificación.`,
            );
          }

          /** Recalcular estado SOLO cuando se creó una nueva factura */
          if (esNueva) await this.actualizarEstadoCliente(factura);
        } catch (err) {
          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err.message}`,
          );
        }
      }
    }
  }

  /**
   *
   * @param cliente toma un cliente tipo cliente internet
   * @param factura una factura tipo factura internet
   * @param templateSid pasamos el SID de la template a usar
   */
  private async enviarWhatsAppFactura(
    cliente: ClienteInternet,
    factura: FacturaInternet,
    templateSid: string,
  ): Promise<void> {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: cliente.empresaId },
      select: { nombre: true },
    });

    const mesFactura = dayjs(factura.fechaPagoEsperada)
      .format('MMMM YYYY')
      .toUpperCase();
    const fechaLimite = dayjs(factura.fechaPagoEsperada).format('DD/MM/YYYY');

    const destinos = formatearTelefonos([
      cliente.telefono,
      // cliente.contactoReferenciaTelefono, //COMENTADO POR EL MOMENTO, NO REFERENCIAS
    ]);

    for (const numero of destinos) {
      await this.twilioService.sendWhatsAppTemplate(numero, templateSid, {
        '1':
          `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
          'Nombre no disponible',
        '2': empresa?.nombre ?? 'Nova Sistemas S.A.',
        '3': mesFactura, // ejemplo: "julio 2025"
        '4': factura.montoPago.toFixed(2),
      });

      this.logger.log(`Factura notificada a ${numero}`);
    }
  }

  /**
   * Recalcula el estado del cliente según facturas pendientes.
   * No toca saldo; saldo ya se incrementó al crear la factura.
   */
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
