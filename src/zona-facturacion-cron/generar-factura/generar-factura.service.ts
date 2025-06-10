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
export class GenerarFacturaService {
  private readonly logger = new Logger(GenerarFacturaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Funcion que toma datos para generar una factura individual
   * no tiene cron, solo es una llamada y devuelve la factura generada
   */
  async generarFacturaIndividual(dataFactura: DatosFacturaGenerate) {
    try {
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

      return newFactura;
    } catch (error) {
      this.logger.error('Error al generar la factura y notificar:', error);
      throw error;
    }
  }
}
