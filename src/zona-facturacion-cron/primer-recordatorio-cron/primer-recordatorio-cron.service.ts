import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
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
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class PrimerRecordatorioCronService {
  private readonly logger = new Logger(PrimerRecordatorioCronService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajePrimerRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturacion: Recordatorio 1');
    // const hoy = dayjs().tz('America/Guatemala');
    const TEMPLATE_SID = this.configService.get<string>(
      'RECORDATORIO_PAGO_1_SID',
    );
    if (!TEMPLATE_SID)
      throw new InternalServerErrorException('SID plantilla faltante');

    /** 1. Empresa para variable {{4}} */
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
      //verificar si está habilitado => proximanete, verificar el booleano en el modelo cliente para enviar o no
      if (!zona.enviarRecordatorio1 || !zona.enviarRecordatorio) continue;

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        try {
          /** 3. Obtener / crear factura pendiente del periodo */
          const { factura, esNueva } =
            await this.facturaManager.obtenerOcrearFactura(
              cliente,
              zona,
              false,
            );

          /* Si la factura ya está pagada, NO enviar recordatorio */
          if (
            !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
              factura.estadoFacturaInternet,
            )
          ) {
            this.logger.debug(
              'La factura ya está pagada, continuando con el siguiente cliente..',
            );
            continue;
          }

          /* Recalcular estado sólo si acabamos de crear la factura */
          // if (esNueva) {
          //   await this.facturaManager.actualizarEstadoCliente(factura);
          // }

          /** 4. Formatear variables de la plantilla */
          const monto = factura.montoPago.toFixed(2);
          const fechaL = dayjs(factura.fechaPagoEsperada).format('DD/MM/YYYY');

          /** 5. Números válidos */
          const destinos = formatearTelefonos([
            cliente.telefono,
            // cliente.contactoReferenciaTelefono, //COMENTADO POR EL MOMENTO, NO REFERENCIAS
          ]);

          for (const numero of destinos) {
            await this.twilioService.sendWhatsAppTemplate(
              numero,
              TEMPLATE_SID,
              {
                '1':
                  `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
                  'Nombre no disponible',
                '2': monto,
                '3': fechaL,
                '4': empresa.nombre,
              },
            );
            this.logger.log(
              `📨 Recordatorio 1 enviado a ${numero} (cliente ${cliente.id})`,
            );
          }
        } catch (err) {
          if (err instanceof NotFoundException) {
            this.logger.debug(
              `Sin factura para cliente ${cliente.id}; no se envía recordatorio.`,
            );
            continue;
          }
          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err.message}`,
          );

          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err.message}`,
          );
        }
      }
    }
  }
}
