import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TwilioService } from 'src/twilio/twilio.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { DatosFacturaGenerate } from '../utils';
import { EstadoCliente } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class GeneracionFacturaCronService {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  //   GENERADOR DE FACTURAS PRIMER PASO
  // @Cron('0 23 * * *', {
  //   timeZone: 'America/Guatemala',
  // })
  @Cron(CronExpression.EVERY_10_SECONDS)
  async gerarFacturacionAutomaticaCron() {
    const hoylocal = dayjs().tz('America/Guatemala');
    console.log(
      '▶️  Fecha en Guatemala (hoylocal):',
      hoylocal.format('YYYY-MM-DD HH:mm:ss'),
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
        .date(zona.diaGeneracionFactura) // día del mes
        .startOf('day'); // 00:00:00 de ese día GMT-6

      console.log(
        `→ Zona ${zona.id}: díaGeneración = ${zona.diaGeneracionFactura}, fechaGeneracion = ${fechaGeneracion.format('YYYY-MM-DD HH:mm:ss')}`,
      );

      if (hoylocal.isSame(fechaGeneracion, 'day')) {
        for (const cliente of zona.clientes) {
          // ---- Lógica para filtrar facturas de este mes ----
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

          // Si el cliente tiene servicio y todavía no existe factura este mes:
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

            const dataFactura: DatosFacturaGenerate = {
              datalleFactura:
                `Pago por suscripción mensual al servicio de internet: ${cleanName} ` +
                `Q${cliente.servicioInternet.precio} — Fecha de pago: ${zona.diaPago}`,
              fechaPagoEsperada: hoylocal
                .date(zona.diaPago)
                .month(hoylocal.month())
                .year(hoylocal.year())
                .isBefore(hoylocal, 'day')
                ? hoylocal.add(1, 'month').date(zona.diaPago).format()
                : hoylocal.date(zona.diaPago).format(),
              montoPago: cliente.servicioInternet.precio,
              saldoPendiente: cliente.servicioInternet.precio,
              estadoFacturaInternet: 'PENDIENTE',
              cliente: cliente.id,
              facturacionZona: zona.id,
              nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
              numerosTelefono: numerosTelefono,
            };

            await this.generarFacturaClientePorZona(dataFactura);
          } else {
            console.error(
              `El cliente ${cliente.nombre} ${cliente.apellidos} no tiene servicio o ya tiene factura este mes.`,
            );
          }
        }
      } else {
        console.log('NO HAY FACTURAS CORRESPONDIENTES PARA CREAR');
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
              id: 1, // o el ID que corresponda
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
          // Si ya trae código de país 502 + 8 dígitos (Total 11 dígitos)
          if (limpio.startsWith('502') && limpio.length === 11) {
            return `whatsapp:+${limpio}`;
          }
          // Si es solo 8 dígitos (nacional), anteponer +502
          if (limpio.length === 8) {
            return `whatsapp:+502${limpio}`;
          }
          // Si ya viene con + código
          if (tel.startsWith('+')) {
            return `whatsapp:${tel}`;
          }
          // Número inválido
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
                : 0.0,

            '5': newFactura.fechaPagoEsperada
              ? dayjs(newFactura.fechaPagoEsperada).format('DD/MM/YYYY')
              : '00/00/0000',
          });
          console.log(`Factura notificada a ${destino}`);
        } catch (err) {
          console.error(`Error al enviar WhatsApp a ${destino}:`, err);
        }
      }

      return newFactura;
    } catch (error) {
      console.error('Error al generar la factura y notificar:', error);
      throw error;
    }
  }
}
