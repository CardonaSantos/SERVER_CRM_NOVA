import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'src/twilio/twilio.service';
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
export class SegundoRecordatorioCronService {
  private readonly logger = new Logger(SegundoRecordatorioCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' }) // ⏰ 10:00 AM GT
  async generarMensajeSegundoRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Recordatorio 2');
    const hoy = dayjs().tz('America/Guatemala');

    const TEMPLATE_SID = this.configService.get<string>(
      'RECORDATORIO_PAGO_2_SID',
    );
    if (!TEMPLATE_SID)
      throw new InternalServerErrorException('SID plantilla faltante');

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
      if (
        shouldSkipZoneToday(zona.diaSegundoRecordatorio) ||
        !(zona.enviarRecordatorio && zona.enviarRecordatorio2)
      ) {
        continue;
      }

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        try {
          /* SOLO buscar la factura: crearSiNoExiste = false */
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
            this.logger.debug(`Factura ya pagada; cliente ${cliente.id}.`);
            continue;
          }

          const monto = factura.montoPago.toFixed(2);
          const fechaL = dayjs(factura.fechaPagoEsperada).format('DD/MM/YYYY');

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
              `📨 Recordatorio 2 enviado a ${numero} (cliente ${cliente.id})`,
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
        }
      }
    }
  }
}
