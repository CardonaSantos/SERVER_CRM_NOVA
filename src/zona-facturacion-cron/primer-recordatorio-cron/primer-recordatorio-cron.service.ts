import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DatosFacturaGenerate,
  formatearFecha,
  formatearNumeroWhatsApp,
  renderTemplate,
} from '../utils';
import { TwilioService } from 'src/twilio/twilio.service';
import { ConfigService } from '@nestjs/config';
import { GenerarFacturaService } from '../generar-factura/generar-factura.service';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import { formatearTelefonos } from '../Functions';
import { GeneracionFacturaCronService } from '../generacion-factura-cron/generacion-factura-cron.service';
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

  // @Cron(CronExpression.EVERY_MINUTE)
  @Cron('0 23 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajePrimerRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturacion: Recordatorio 1');
    const hoy = dayjs().tz('America/Guatemala');
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
      /* 2.a ¿Es el día de este recordatorio y está habilitado? */
      const esHoy = zona.diaRecordatorio
        ? hoy.isSame(hoy.date(zona.diaRecordatorio), 'day')
        : false;
      if (!esHoy) continue;
      if (
        !zona.enviarRecordatorio1 ||
        !zona.enviarRecordatorio ||
        !zona.whatsapp
      )
        continue;

      for (const cliente of zona.clientes) {
        if (!cliente.servicioInternet) continue;

        try {
          /** 3. Obtener / crear factura pendiente del periodo */
          const { factura, esNueva } =
            await this.facturaManager.obtenerOcrearFactura(cliente, zona);

          /* Si la factura ya está pagada, NO enviar recordatorio */
          if (
            !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
              factura.estadoFacturaInternet,
            )
          )
            continue;

          /* Recalcular estado sólo si acabamos de crear la factura */
          if (esNueva) {
            await this.facturaManager.actualizarEstadoCliente(factura);
          }

          /** 4. Formatear variables de la plantilla */
          const monto = factura.montoPago.toFixed(2);
          const fechaL = dayjs(factura.fechaPagoEsperada).format('DD/MM/YYYY');

          /** 5. Números válidos */
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
              `📨 Recordatorio 1 enviado a ${numero} (cliente ${cliente.id})`,
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
