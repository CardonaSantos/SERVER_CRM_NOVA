import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TwilioService } from 'src/twilio/twilio.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { DatosFacturaGenerate, DatosFacturaGenerateIndividual } from '../utils';
import { EstadoCliente } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class GeneracionFacturaCronService {
  private readonly logger = new Logger(GeneracionFacturaCronService.name);
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  // @Cron(CronExpression.EVERY_10_SECONDS)
  /**
   * Genera la facturación automática para los clientes.
   * Este método se ejecuta diariamente a las 11 PM (hora de Guatemala).
   * Revisa las zonas de facturación y genera facturas para los clientes o llama inmediatamente
   * al método `generarFacturaClientePorZona` para generar una a un cliente.
   */
  @Cron('0 23 * * *', {
    timeZone: 'America/Guatemala',
  })
  async gerarFacturacionAutomaticaCron() {
    const hoylocal = dayjs().tz('America/Guatemala');
    this.logger.debug(
      `▶️ Fecha en Guatemala (hoylocal): ${hoylocal.format('YYYY-MM-DD HH:mm:ss')}`,
    );

    const zonasFacturaciones = await this.prisma.facturacionZona.findMany({
      include: {
        clientes: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            contactoReferenciaTelefono: true,
            facturaInternet: {
              select: {
                id: true,
                creadoEn: true,
                fechaPagoEsperada: true,
                actualizadoEn: true,
                fechaPagada: true,
                pagos: true,
              },
            },
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
              },
            },
            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    for (const zona of zonasFacturaciones) {
      const fechaGeneracion = hoylocal
        .date(zona.diaGeneracionFactura)
        .startOf('day');

      this.logger.debug(
        `→ Zona ${zona.id}: diaGeneracionFactura=${zona.diaGeneracionFactura}, fechaGeneracion=${fechaGeneracion.format('YYYY-MM-DD HH:mm:ss')}`,
      );

      if (hoylocal.isSame(fechaGeneracion, 'day')) {
        this.logger.log(`Generando facturas para zona ${zona.id}...`);

        for (const cliente of zona.clientes) {
          const facturasEsteMes = cliente.facturaInternet.filter((fact) => {
            const creadoEn = dayjs(fact.creadoEn).tz('America/Guatemala');
            const fechaPagoEsperada = dayjs(fact.fechaPagoEsperada).tz(
              'America/Guatemala',
            );
            return (
              creadoEn.isSame(hoylocal, 'month') &&
              creadoEn.isSame(hoylocal, 'year') &&
              fechaPagoEsperada.isSame(hoylocal, 'month') &&
              fechaPagoEsperada.isSame(hoylocal, 'year')
            );
          });

          if (cliente.servicioInternet && facturasEsteMes.length <= 0) {
            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((n) => n.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((n) => n.trim()),
            ];

            const cleanName = cliente.servicioInternet.nombre.replace(
              /^plan\s*/i,
              '',
            );

            const fechaPagoEsperada = hoylocal
              .date(zona.diaPago)
              .month(hoylocal.month())
              .year(hoylocal.year());

            // Si la fecha de pago esperada ya pasó, se agenda para el próximo mes
            const fechaPagoFinal = fechaPagoEsperada.isBefore(hoylocal, 'day')
              ? fechaPagoEsperada.add(1, 'month')
              : fechaPagoEsperada;

            const dataFactura: DatosFacturaGenerate = {
              datalleFactura:
                `Pago por suscripción mensual al servicio de internet: ${cleanName} ` +
                `Q${cliente.servicioInternet.precio} — Fecha de pago: ${zona.diaPago}`,
              fechaPagoEsperada: fechaPagoFinal.format(),
              montoPago: cliente.servicioInternet.precio,
              saldoPendiente: cliente.servicioInternet.precio,
              estadoFacturaInternet: 'PENDIENTE',
              cliente: cliente.id,
              facturacionZona: zona.id,
              nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
              numerosTelefono: numerosTelefono,
            };

            this.logger.log(
              `Generando factura para cliente ${cliente.nombre} ${cliente.apellidos}`,
            );
            try {
              await this.generarFacturaClientePorZona(dataFactura);
            } catch (error) {
              this.logger.error(
                `Error generando factura para cliente ${cliente.nombre} ${cliente.apellidos}:`,
                error,
              );
            }
          } else {
            this.logger.warn(
              `No se genera factura para cliente ${cliente.nombre} ${cliente.apellidos}: sin servicio o factura ya creada este mes.`,
            );
          }
        }
      } else {
        this.logger.debug('No es día de generación de facturas para esta zona');
      }
    }
  }

  async generarFacturaClientePorZona(dataFactura: DatosFacturaGenerate) {
    try {
      const Template_SID = this.configService.get<string>(
        'GENERACION_FACTURA_1_SID',
      );

      if (!Template_SID) {
        throw new InternalServerErrorException(
          'Error al encontrar SID Template',
        );
      }

      // Verificación adicional para evitar facturas duplicadas (opcional)
      const facturaExistente = await this.prisma.facturaInternet.findFirst({
        where: {
          clienteId: dataFactura.cliente,
          fechaPagoEsperada: {
            gte: dayjs(dataFactura.fechaPagoEsperada).startOf('month').toDate(),
            lt: dayjs(dataFactura.fechaPagoEsperada).endOf('month').toDate(),
          },
        },
      });

      if (facturaExistente) {
        this.logger.warn(
          `Factura ya existe para cliente ${dataFactura.cliente} en el mes ${dayjs(dataFactura.fechaPagoEsperada).format('MMMM YYYY')}, se evita duplicación.`,
        );
        return facturaExistente;
      }

      const newFactura = await this.prisma.facturaInternet.create({
        data: {
          fechaPagoEsperada: dayjs(dataFactura.fechaPagoEsperada).toDate(),
          montoPago: dataFactura.montoPago,
          saldoPendiente: dataFactura.saldoPendiente,
          estadoFacturaInternet: 'PENDIENTE',
          cliente: {
            connect: { id: dataFactura.cliente },
          },
          facturacionZona: {
            connect: { id: dataFactura.facturacionZona },
          },
          nombreClienteFactura: dataFactura.nombreClienteFactura,
          detalleFactura: dataFactura.datalleFactura,
          empresa: {
            connect: {
              id: 1,
            },
          },
        },
      });

      await this.prisma.saldoCliente.update({
        where: { clienteId: newFactura.clienteId },
        data: { saldoPendiente: { increment: newFactura.montoPago } },
      });

      const facturasPendientes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId: newFactura.clienteId,
          estadoFacturaInternet: {
            in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
          },
        },
      });

      const estadoPendiente = facturasPendientes.length;
      let estadoCliente: EstadoCliente;

      switch (estadoPendiente) {
        case 0:
          estadoCliente = 'ACTIVO';
          break;
        case 1:
          estadoCliente = 'PENDIENTE_ACTIVO';
          break;
        case 2:
          estadoCliente = 'ATRASADO';
          break;
        case 3:
          estadoCliente = 'MOROSO';
          break;
        default:
          estadoCliente = 'MOROSO'; // fallback en caso de >3 facturas pendientes
          break;
      }

      await this.prisma.clienteInternet.update({
        where: { id: newFactura.clienteId },
        data: { estadoCliente: estadoCliente },
      });

      const cliente = await this.prisma.clienteInternet.findUnique({
        where: { id: newFactura.clienteId },
        select: {
          nombre: true,
          apellidos: true,
          telefono: true,
          contactoReferenciaTelefono: true,
          empresaId: true,
          servicioInternet: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${newFactura.clienteId} no encontrado`,
        );
      }

      const empresa = await this.prisma.empresa.findUnique({
        where: { id: cliente.empresaId ?? 1 },
        select: { nombre: true },
      });

      if (!empresa) {
        throw new NotFoundException(
          `Empresa con ID ${cliente.empresaId} no encontrada`,
        );
      }

      const telefonosRaw = [
        ...(cliente.telefono ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
        ...(cliente.contactoReferenciaTelefono ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
      ];

      const destinos = telefonosRaw
        .map((tel) => {
          const limpio = tel.replace(/\D/g, '');
          if (limpio.startsWith('502') && limpio.length === 11) {
            return `whatsapp:+${limpio}`;
          }
          if (limpio.length === 8) {
            return `whatsapp:+502${limpio}`;
          }
          if (tel.startsWith('+')) {
            return `whatsapp:${tel}`;
          }
          return null;
        })
        .filter((t): t is string => !!t);

      const mesFactura = dayjs(newFactura.fechaPagoEsperada).format(
        'MMMM YYYY',
      );

      for (const destino of destinos) {
        try {
          await this.twilioService.sendWhatsAppTemplate(destino, Template_SID, {
            '1':
              cliente.nombre && cliente.apellidos
                ? `${cliente.nombre} ${cliente.apellidos}`
                : 'Nombre no disponible',
            '2': empresa.nombre || 'Nova Sistemas S.A.',
            '3': mesFactura || '00/00/0000',
            '4':
              newFactura.montoPago !== undefined &&
              newFactura.montoPago !== null
                ? newFactura.montoPago.toFixed(2)
                : '0.00',
            '5': newFactura.fechaPagoEsperada
              ? dayjs(newFactura.fechaPagoEsperada).format('DD/MM/YYYY')
              : '00/00/0000',
          });
          this.logger.log(`Factura notificada vía WhatsApp a ${destino}`);
        } catch (err) {
          this.logger.error(`Error al enviar WhatsApp a ${destino}:`, err);
        }
      }

      return newFactura;
    } catch (error) {
      this.logger.error('Error al generar la factura y notificar:', error);
      throw error;
    }
  }
}
