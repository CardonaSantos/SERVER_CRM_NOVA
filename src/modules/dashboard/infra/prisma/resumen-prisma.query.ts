import { Injectable } from '@nestjs/common';
import {
  EstadoCliente,
  EstadoCobranzaCliente,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';
import { rangoDiasNegocio } from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  RangoFechas,
  sumarDias,
} from '../../domain/policies/calendario.policy';
import { ResumenQueryPort } from '../../domain/ports/resumen-query.port';
import { DatosResumen } from '../../domain/read-models/resumen.read-model';

@Injectable()
export class ResumenPrismaQuery implements ResumenQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findDatos(rango: RangoFechas): Promise<DatosResumen> {
    const periodo = rangoDiasNegocio(
      rango.desde,
      sumarDias(rango.hastaExclusivo, -1),
    );
    const vigentes = {
      isEliminado: false,
    } satisfies Prisma.ClienteInternetWhereInput;
    // Las facturas del mes son las de su `periodo` (`YYYYMM`), como en la
    // gráfica mensual, sin importar el día en que se crearon.
    const emitidas = {
      periodo: rango.desde.slice(0, 7).replace('-', ''),
      estadoFacturaInternet: { not: StateFacturaInternet.ANULADA },
    } satisfies Prisma.FacturaInternetWhereInput;

    const [
      totalEnSistema,
      porServicio,
      porCobranza,
      facturasEmitidasMes,
      facturasPagadasMes,
      facturado,
      cobrado,
    ] = await Promise.all([
      this.prisma.clienteInternet.count({ where: vigentes }),
      this.prisma.clienteInternet.groupBy({
        by: ['estadoCliente'],
        where: vigentes,
        _count: { _all: true },
      }),
      // La cobranza no cuenta a los desinstalados.
      this.prisma.clienteInternet.groupBy({
        by: ['estadoCobranza'],
        where: {
          ...vigentes,
          estadoCliente: { not: EstadoCliente.DESINSTALADO },
        },
        _count: { _all: true },
      }),
      this.prisma.facturaInternet.count({ where: emitidas }),
      this.prisma.facturaInternet.count({
        where: {
          estadoFacturaInternet: StateFacturaInternet.PAGADA,
          fechaPagada: periodo,
        },
      }),
      this.prisma.facturaInternet.aggregate({
        where: emitidas,
        _sum: { montoPago: true, saldoPendiente: true },
      }),
      // Lo cobrado sale de los pagos, sea cual sea el mes de la factura.
      this.prisma.pagoFacturaInternet.aggregate({
        where: { fechaPago: periodo },
        _sum: { montoPagado: true },
      }),
    ]);

    const servicio = new Map(
      porServicio.map((f) => [f.estadoCliente, f._count._all]),
    );
    const cobranza = new Map(
      porCobranza.map((f) => [f.estadoCobranza, f._count._all]),
    );
    const clientes = (estado: EstadoCliente) => servicio.get(estado) ?? 0;
    const enCobranza = (estado: EstadoCobranzaCliente) =>
      cobranza.get(estado) ?? 0;

    return {
      totalEnSistema,
      servicio: {
        activos: clientes(EstadoCliente.ACTIVO),
        suspendidos: clientes(EstadoCliente.SUSPENDIDO),
        pendientesActivacion: clientes(EstadoCliente.PENDIENTE_ACTIVO),
        enInstalacion: clientes(EstadoCliente.EN_INSTALACION),
        desinstalados: clientes(EstadoCliente.DESINSTALADO),
      },
      cobranza: {
        alDia: enCobranza(EstadoCobranzaCliente.AL_DIA),
        pagoPendiente: enCobranza(EstadoCobranzaCliente.PAGO_PENDIENTE),
        atrasados: enCobranza(EstadoCobranzaCliente.ATRASADO),
        morosos: enCobranza(EstadoCobranzaCliente.MOROSO),
      },
      facturacion: {
        facturasEmitidasMes,
        facturasPagadasMes,
        montoFacturadoMes: facturado._sum.montoPago ?? 0,
        montoCobradoMes: cobrado._sum.montoPagado ?? 0,
        montoPendienteMes: facturado._sum.saldoPendiente ?? 0,
      },
    };
  }
}
