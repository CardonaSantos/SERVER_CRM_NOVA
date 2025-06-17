import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  DatosFacturaGenerate,
  formatearFecha,
  formatearNumeroWhatsApp,
  renderTemplate,
} from '../utils';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'src/twilio/twilio.service';
import { GenerarFacturaService } from '../generar-factura/generar-factura.service';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import { formatearTelefonos } from '../Functions';
// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SegundoRecordatorioCronService {
  private readonly logger = new Logger(SegundoRecordatorioCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly generarFactura: GenerarFacturaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  @Cron('0 23 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajeSegundoRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Recordatorio 2');
    const hoy = dayjs().tz('America/Guatemala');

    /* 0️⃣ SID de la plantilla */
    const TEMPLATE_SID = this.configService.get<string>(
      'RECORDATORIO_PAGO_2_SID',
    );
    if (!TEMPLATE_SID)
      throw new InternalServerErrorException('SID plantilla faltante');

    /* 1️⃣ Empresa para {{4}} */
    const empresa = await this.prisma.empresa.findFirst({
      select: { nombre: true },
    });
    if (!empresa) {
      this.logger.error('Empresa no encontrada; abortando cron.');
      return;
    }

    /* 2️⃣ Zonas + clientes */
    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      /* Día y flags del segundo recordatorio */
      const esHoy = zona.diaSegundoRecordatorio
        ? hoy.isSame(hoy.date(zona.diaSegundoRecordatorio), 'day')
        : false;
      const habilitado =
        zona.enviarRecordatorio2 && zona.enviarRecordatorio && zona.whatsapp;

      if (!esHoy || !habilitado) continue;

      for (const cliente of zona.clientes) {
        if (!cliente.servicioInternet) continue;

        try {
          /* 3️⃣ Obtener / crear factura pendiente */
          const { factura, esNueva } =
            await this.facturaManager.obtenerOcrearFactura(cliente, zona);

          /* Saltar si ya está liquidada */
          if (
            !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
              factura.estadoFacturaInternet,
            )
          )
            continue;

          /* Recalcular estado si acabamos de crear la factura */
          if (esNueva)
            await this.facturaManager.actualizarEstadoCliente(factura);

          /* 4️⃣ Variables de plantilla */
          const monto = factura.montoPago.toFixed(2);
          const fechaL = dayjs(factura.fechaPagoEsperada).format('DD/MM/YYYY');

          /* 5️⃣ Destinos */
          const destinos = formatearTelefonos([
            cliente.telefono,
            cliente.contactoReferenciaTelefono,
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
          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err.message}`,
          );
        }
      }
    }
  }
}
