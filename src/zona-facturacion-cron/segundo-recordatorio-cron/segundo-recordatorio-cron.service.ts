import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
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
// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SegundoRecordatorioCronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,

    private readonly configService: ConfigService,
  ) {}

  @Cron('0 23 * * *', {
    timeZone: 'America/Guatemala',
  })
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async generarMensajeSegundoRecordatorio() {
    try {
      const Template_SID = this.configService.get<string>(
        'RECORDATORIO_PAGO_2_SID',
      );

      if (!Template_SID) {
        throw new InternalServerErrorException(
          'Error al encontrar SID Template',
        );
      }
      const hoylocal = dayjs().tz('America/Guatemala');
      const inicioMesLocal = hoylocal.startOf('month');
      const finMesLocal = hoylocal.endOf('month');

      const infoEmpresa = await this.prisma.empresa.findFirst({
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      });

      if (!infoEmpresa) {
        console.warn('Empresa no encontrada. Abortando ejecución.');
        return;
      }

      const bodyTemplate = await this.prisma.plantillaMensaje.findFirst({
        where: {
          tipo: 'RECORDATORIO_2',
        },
      });

      if (!bodyTemplate) {
        console.warn('Plantilla RECORDATORIO_2 no encontrada.');
        return;
      }

      const zonasDeFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          diaSegundoRecordatorio: true,
          enviarRecordatorio2: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              servicioInternet: {
                select: {
                  nombre: true,
                  velocidad: true,
                },
              },
            },
          },
        },
      });

      for (const zona of zonasDeFacturacion) {
        if (!zona.diaSegundoRecordatorio) continue;
        if (zona.enviarRecordatorio2 === false) continue;

        const fechaRecordatorio = hoylocal.date(zona.diaSegundoRecordatorio);

        if (!hoylocal.isSame(fechaRecordatorio, 'day')) continue;

        for (const cliente of zona.clientes) {
          try {
            const factura = await this.prisma.facturaInternet.findFirst({
              where: {
                clienteId: cliente.id,
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
                },
                facturacionZonaId: zona.id,
                fechaPagoEsperada: {
                  gte: inicioMesLocal.toDate(),
                  lte: finMesLocal.toDate(),
                },
              },
              select: {
                fechaPagoEsperada: true,
                detalleFactura: true,
                montoPago: true,
              },
            });

            if (!factura) continue;

            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((num) => num.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((num) => num.trim()),
            ].filter((num) => num);

            const numerosValidos = numerosTelefono
              .map((n) => {
                try {
                  return formatearNumeroWhatsApp(n);
                } catch (err) {
                  console.warn(`Número descartado: ${n} -> ${err.message}`);
                  return null;
                }
              })
              .filter(Boolean);

            for (const numero of numerosValidos) {
              try {
                await this.twilioService.sendWhatsAppTemplate(
                  numero,
                  Template_SID,
                  {
                    '1':
                      cliente.nombre && cliente.apellidos
                        ? `${cliente.nombre} ${cliente.apellidos}`
                        : 'Nombre no disponible',

                    '2':
                      factura.montoPago !== undefined &&
                      factura.montoPago !== null
                        ? factura.montoPago.toString()
                        : 0.0,

                    '3': factura.fechaPagoEsperada
                      ? formatearFecha(factura.fechaPagoEsperada.toISOString())
                      : '00/00/0000',

                    '4': infoEmpresa.nombre || 'Nova Sistemas S.A.',
                  },
                );
              } catch (error) {
                console.log('El error es: ', error);
                return error;
              }
            }
          } catch (clienteError) {
            console.warn(
              `Error procesando cliente ${cliente.id}:`,
              clienteError,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Error general en CRON primer recordatorio:', error);
    }
  }
}
