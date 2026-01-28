import { throwFatalError } from 'src/Utils/CommonFatalError';
import { verifyCustomerRepository } from '../domain/verify-customer.repo';
import { verifyClientDto } from '../dto/verify-customer.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoFactura, StateFacturaInternet } from '@prisma/client';
// DAYJS
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

@Injectable()
export class PrismaVerifyCustomerRepository
  implements verifyCustomerRepository
{
  private readonly logger = new Logger(PrismaVerifyCustomerRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async verifyCustomer(dto: verifyClientDto) {
    try {
      const { id } = dto;
      const customer = await this.prisma.clienteInternet.findUnique({
        where: {
          id,
        },
        select: {
          creadoEn: true,
          actualizadoEn: true,
          facturaInternet: {
            select: {
              id: true,
              estadoFacturaInternet: true,
              creadoEn: true,
              fechaPagoEsperada: true,
              fechaPagada: true,
              pagos: {
                where: {},
                select: {
                  id: true,
                  fechaPago: true,
                  montoPagado: true,
                },
              },
            },
          },
        },
      });

      if (!customer) throw new NotFoundException('Cliente no encontrado');

      this.logger.log(`USUARIO:\n${JSON.stringify(customer, null, 2)}`);
      const facturas = customer.facturaInternet;
      this.logger.log(`Facturas encontradas: ${facturas.length}`);

      facturas.forEach((f) =>
        this.logger.log(`Factura ${f.id} - pagos: ${f.pagos.length}`),
      );

      return await this.calculatePunctuality(facturas);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaVerifyCustomerRepository.verifyCustomer',
      );
    }
  }

  async calculatePunctuality(
    facturas: {
      id: number;
      creadoEn: Date;
      fechaPagoEsperada: Date;
      fechaPagada: Date;

      estadoFacturaInternet: StateFacturaInternet;
      pagos: {
        id: number;
        montoPagado: number;
        fechaPago: Date;
      }[];
    }[],
  ) {
    interface pagoResult {
      id: number;
      pagadaATiempo: boolean;
      diferencia: number;
      fechaVencimiento: string;
      fechaPagada: string;
    }

    try {
      let arrayFacturasPrcesadas = [];
      for (const factura of facturas) {
        if (factura.pagos.length === 0) continue;

        const primerPago = factura.pagos
          .slice()
          .sort((a, b) => +a.fechaPago - +b.fechaPago)[0];

        const diferenciaDias = dayjs(factura.fechaPagoEsperada)
          .startOf('day')
          .diff(dayjs(primerPago.fechaPago).startOf('day'), 'days');

        arrayFacturasPrcesadas.push({
          facturaId: factura.id,
          pagadaATiempo: diferenciaDias >= 0,
          diferencia: diferenciaDias,
          fechaVencimiento: dayjs(factura.fechaPagoEsperada).format(
            'DD/MM/YYYY',
          ),
          fechaPagada: dayjs(primerPago.fechaPago).format('DD/MM/YYYY'),
        });
      }

      return arrayFacturasPrcesadas;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaVerifyCustomerRepository.VerifyCustomer',
      );
    }
  }
}
