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

interface HistorialPago {
  facturaId: number;
  pagadaATiempo: boolean;
  diferencia: number; // días (negativo = atraso)
  fechaVencimiento: string; // DD/MM/YYYY
  fechaPagada: string; // DD/MM/YYYY
}
const TOLERANCIA_DIAS = 3;

@Injectable()
export class PrismaVerifyCustomerRepository
  implements verifyCustomerRepository
{
  private readonly logger = new Logger(PrismaVerifyCustomerRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async verifyCustomer(id: number) {
    try {
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

      let historialPagos = await this.calculatePunctuality(facturas);
      const resultado = this.generarResultado(historialPagos);
      return resultado;
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

        const pagadaATiempo = diferenciaDias >= -TOLERANCIA_DIAS;

        arrayFacturasPrcesadas.push({
          facturaId: factura.id,
          pagadaATiempo: pagadaATiempo,
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

  calcularResumen(historial: HistorialPago[]) {
    const base = {
      total: historial.length,
      aTiempo: 0,
      atrasadas: 0,
      sumaAtraso: 0,
      atrasos: [] as number[],
      rachaActual: 0,
    };

    const ULTIMAS = 6;
    const recientes = historial.slice(-ULTIMAS);

    for (const h of historial) {
      if (h.pagadaATiempo) {
        base.aTiempo++;
      } else {
        base.atrasadas++;
        const atraso = Math.abs(h.diferencia);
        base.sumaAtraso += atraso;
        base.atrasos.push(atraso);
      }
    }

    base.rachaActual = recientes.filter((h) => h.pagadaATiempo).length;

    return base;
  }

  mediana(valores: number[]) {
    if (valores.length === 0) return 0;

    const sorted = [...valores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  scoreInvertido(valor: number, max: number) {
    if (valor <= 0) return 100;
    if (valor >= max) return 0;
    return Math.round(100 - (valor / max) * 100);
  }

  generarResultado(historial: HistorialPago[]) {
    const acc = this.calcularResumen(historial);

    const puntualidadPct = acc.total > 0 ? (acc.aTiempo / acc.total) * 100 : 0;

    const promedioAtraso =
      acc.atrasadas > 0 ? acc.sumaAtraso / acc.atrasadas : 0;

    const medianaAtraso = this.mediana(acc.atrasos);

    const puntualidadScore = puntualidadPct;
    const promedioScore = this.scoreInvertido(promedioAtraso, 120);
    const medianaScore = this.scoreInvertido(medianaAtraso, 120);
    const rachaScore = Math.min(acc.rachaActual * 20, 100);

    const scoreFinal = Math.round(
      puntualidadScore * 0.4 +
        medianaScore * 0.25 +
        promedioScore * 0.15 +
        rachaScore * 0.2,
    );

    let clasificacion: string;
    if (scoreFinal >= 80) clasificacion = 'CONFIABLE';
    else if (scoreFinal >= 60) clasificacion = 'RIESGO_MEDIO';
    else if (scoreFinal >= 40) clasificacion = 'RIESGO_ALTO';
    else clasificacion = 'NO_APROBABLE';

    return {
      historial,
      resumen: {
        puntualidadPct: Number(puntualidadPct.toFixed(1)),
        promedioAtraso: Math.round(promedioAtraso),
        medianaAtraso,
        rachaActual: acc.rachaActual,
        score: scoreFinal,
        clasificacion,
      },
    };
  }
}
