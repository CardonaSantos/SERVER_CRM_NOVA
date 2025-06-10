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
    private readonly generarFactura: GenerarFacturaService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron('0 23 * * *', {
    timeZone: 'America/Guatemala',
  })
  async generarMensajePrimerRecordatorio() {
    try {
      const Template_SID = this.configService.get<string>(
        'RECORDATORIO_PAGO_1_SID',
      );

      if (!Template_SID) {
        throw new InternalServerErrorException('SID template no encontrado');
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

      const zonasDeFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          diaPago: true,
          diaRecordatorio: true,
          enviarRecordatorio1: true,

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
                  precio: true,
                  velocidad: true,
                },
              },
            },
          },
        },
      });

      for (const zona of zonasDeFacturacion) {
        if (!zona.diaRecordatorio) continue;
        if (zona.enviarRecordatorio1 === false) continue;

        const fechaRecordatorio = hoylocal.date(zona.diaRecordatorio);

        if (!hoylocal.isSame(fechaRecordatorio, 'day')) continue;

        for (const cliente of zona.clientes) {
          try {
            let factura = await this.prisma.facturaInternet.findFirst({
              orderBy: {
                fechaPagoEsperada: 'desc', //la mas reciente creada
              },
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

            if (!factura) {
              try {
                const dataFactura: DatosFacturaGenerate = {
                  datalleFactura: `Pago por suscripción mensual al servicio de internet: ${cliente.servicioInternet.nombre} Q${cliente.servicioInternet.precio} — Fecha de pago: ${zona.diaPago}`,
                  fechaPagoEsperada: fechaRecordatorio.format(),
                  montoPago: cliente.servicioInternet.precio,
                  saldoPendiente: cliente.servicioInternet.precio,
                  estadoFacturaInternet: 'PENDIENTE',
                  cliente: cliente.id,
                  facturacionZona: zona.id,
                  nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
                  numerosTelefono: [
                    ...(cliente.telefono ?? '').split(',').map((n) => n.trim()),
                    ...(cliente.contactoReferenciaTelefono ?? '')
                      .split(',')
                      .map((n) => n.trim()),
                  ],
                };

                factura =
                  await this.generarFactura.generarFacturaIndividual(
                    dataFactura,
                  );
                this.logger.log(
                  `Factura creada al vuelo para cliente ${cliente.id}`,
                );
              } catch (error) {
                this.logger.debug(
                  `Error al generar factura para cliente ${cliente.id}: ${error.message}`,
                );
                continue; // Saltar al siguiente cliente si falla la generación de factura
              }
            }

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
                this.logger.log(
                  `Primer recordatorio enviado a ${numero} para cliente ${cliente.id}`,
                );
              } catch (error) {
                this.logger.warn(
                  `Error procesando cliente ${cliente.id}`,
                  error,
                );
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
