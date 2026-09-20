import { Injectable } from '@nestjs/common';

import {
  EstadoCliente,
  MetodoPagoFacturaInternet,
  OrigenPago,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  FacturacionReporteEstadoFactura,
  type FacturacionReporteEstadoFactura as FacturacionReporteEstadoFacturaType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import {
  FacturacionReporteMetodoPago,
  type FacturacionReporteMetodoPago as FacturacionReporteMetodoPagoType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import {
  FacturacionReporteOrigenPago,
  type FacturacionReporteOrigenPago as FacturacionReporteOrigenPagoType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-origen-pago.enum';

import {
  FacturacionReporteCarteraQueryParams,
  FacturacionReporteFacturaQueryParams,
  FacturacionReporteFacturasProyeccionQueryParams,
  FacturacionReportePagoCohorteQueryParams,
  FacturacionReportePagoRangoQueryParams,
  FacturacionReporteProyeccionQueryParams,
  FacturacionReporteQueryPort,
} from '../../../domain/ports/facturacion-reportes/facturacion-reporte-query.port';

import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionProyeccionClienteRow } from '../../../domain/read-models/facturacion-reporte/facturacion-proyeccion-cliente-row';

import { FacturacionReportePrismaMapper } from './facturacion-reporte-prisma.mapper';

import {
  selectClienteFacturacionProyeccionReport,
  selectFacturaInternetReport,
  selectPagoFacturaInternetReport,
} from './facturacion-reporte-selects.query';

// DOMINIO -> PRISMA

const ESTADO_FACTURA_TO_PRISMA: Record<
  FacturacionReporteEstadoFacturaType,
  StateFacturaInternet
> = {
  [FacturacionReporteEstadoFactura.PENDIENTE]: StateFacturaInternet.PENDIENTE,

  [FacturacionReporteEstadoFactura.PAGADA]: StateFacturaInternet.PAGADA,

  [FacturacionReporteEstadoFactura.VENCIDA]: StateFacturaInternet.VENCIDA,

  [FacturacionReporteEstadoFactura.ANULADA]: StateFacturaInternet.ANULADA,

  [FacturacionReporteEstadoFactura.PARCIAL]: StateFacturaInternet.PARCIAL,
};

const METODO_PAGO_TO_PRISMA: Record<
  FacturacionReporteMetodoPagoType,
  MetodoPagoFacturaInternet
> = {
  [FacturacionReporteMetodoPago.EFECTIVO]: MetodoPagoFacturaInternet.EFECTIVO,

  [FacturacionReporteMetodoPago.TARJETA]: MetodoPagoFacturaInternet.TARJETA,

  [FacturacionReporteMetodoPago.DEPOSITO]: MetodoPagoFacturaInternet.DEPOSITO,

  [FacturacionReporteMetodoPago.PAYPAL]: MetodoPagoFacturaInternet.PAYPAL,

  [FacturacionReporteMetodoPago.PENDIENTE]: MetodoPagoFacturaInternet.PENDIENTE,

  [FacturacionReporteMetodoPago.OTRO]: MetodoPagoFacturaInternet.OTRO,
};

const ORIGEN_PAGO_TO_PRISMA: Record<
  FacturacionReporteOrigenPagoType,
  OrigenPago
> = {
  [FacturacionReporteOrigenPago.RUTA]: OrigenPago.RUTA,

  [FacturacionReporteOrigenPago.OFICINA]: OrigenPago.OFICINA,

  [FacturacionReporteOrigenPago.TRANSFERENCIA]: OrigenPago.TRANSFERENCIA,

  [FacturacionReporteOrigenPago.EN_LINEA]: OrigenPago.EN_LINEA,
};

// QUERY ADAPTER

@Injectable()
export class FacturacionReportePrismaQuery
  implements FacturacionReporteQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  // FACTURAS DEL RANGO

  async findFacturas(
    params: FacturacionReporteFacturaQueryParams,
  ): Promise<FacturaReporteRow[]> {
    const where = this.buildFacturasWhere(params);

    const facturas = await this.prisma.facturaInternet.findMany({
      where,

      select: selectFacturaInternetReport,

      orderBy: [
        {
          periodo: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return facturas.map((factura) =>
      FacturacionReportePrismaMapper.facturaToRow(factura),
    );
  }

  // PAGOS REGISTRADOS EN EL RANGO

  async findPagosRegistrados(
    params: FacturacionReportePagoRangoQueryParams,
  ): Promise<PagoReporteRow[]> {
    const where = this.buildPagosRegistradosWhere(params);

    const pagos = await this.prisma.pagoFacturaInternet.findMany({
      where,

      select: selectPagoFacturaInternetReport,

      orderBy: [
        {
          fechaPago: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return pagos.map((pago) => FacturacionReportePrismaMapper.pagoToRow(pago));
  }

  // PAGOS DE LA COHORTE DE FACTURAS

  async findPagosDeFacturas(
    params: FacturacionReportePagoCohorteQueryParams,
  ): Promise<PagoReporteRow[]> {
    const where = this.buildPagosCohorteWhere(params);

    const pagos = await this.prisma.pagoFacturaInternet.findMany({
      where,

      select: selectPagoFacturaInternetReport,

      orderBy: [
        {
          fechaPago: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return pagos.map((pago) => FacturacionReportePrismaMapper.pagoToRow(pago));
  }

  // CARTERA PENDIENTE ACTUAL

  async findCarteraPendiente(
    params: FacturacionReporteCarteraQueryParams,
  ): Promise<FacturaReporteRow[]> {
    const where = this.buildCarteraWhere(params);

    const facturas = await this.prisma.facturaInternet.findMany({
      where,

      select: selectFacturaInternetReport,

      orderBy: [
        {
          periodo: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return facturas.map((factura) =>
      FacturacionReportePrismaMapper.facturaToRow(factura),
    );
  }

  // CLIENTES PARA PROYECCIÓN

  async findClientesProyeccion(
    params: FacturacionReporteProyeccionQueryParams,
  ): Promise<FacturacionProyeccionClienteRow[]> {
    const where = this.buildProyeccionWhere(params);

    const clientes = await this.prisma.clienteInternet.findMany({
      where,

      select: selectClienteFacturacionProyeccionReport,

      orderBy: [
        {
          facturacionZonaId: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return clientes.map((cliente) =>
      FacturacionReportePrismaMapper.proyeccionClienteToRow(cliente),
    );
  }

  // WHERE - FACTURAS

  private buildFacturasWhere(
    params: FacturacionReporteFacturaQueryParams,
  ): Prisma.FacturaInternetWhereInput {
    const conditions: Prisma.FacturaInternetWhereInput[] = [];

    /**
     * FacturaInternet.periodo tiene formato YYYYMM
     * y longitud fija.
     *
     * Por ello el orden lexicográfico coincide
     * con el orden cronológico:
     *
     * 202501 < 202502 < 202601
     */
    conditions.push({
      periodo: {
        gte: params.periodoDesde,
        lte: params.periodoHasta,
      },
    });

    if (params.estadosFactura.length > 0) {
      conditions.push({
        estadoFacturaInternet: {
          in: params.estadosFactura.map(
            (estado) => ESTADO_FACTURA_TO_PRISMA[estado],
          ),
        },
      });
    }

    if (params.zonaIds.length > 0) {
      conditions.push({
        facturacionZonaId: {
          in: params.zonaIds,
        },
      });
    }

    if (params.creadorIds.length > 0) {
      conditions.push({
        creadorId: {
          in: params.creadorIds,
        },
      });
    }

    if (params.clienteId !== null) {
      conditions.push({
        clienteId: params.clienteId,
      });
    }

    return {
      AND: conditions,
    };
  }

  // WHERE - PAGOS DEL RANGO

  private buildPagosRegistradosWhere(
    params: FacturacionReportePagoRangoQueryParams,
  ): Prisma.PagoFacturaInternetWhereInput {
    const conditions: Prisma.PagoFacturaInternetWhereInput[] = [];

    // FECHA REAL DEL PAGO

    conditions.push({
      fechaPago: {
        gte: params.fechaPagoDesdeInclusivo,

        lt: params.fechaPagoHastaExclusivo,
      },
    });

    // MÉTODO

    if (params.metodosPago.length > 0) {
      conditions.push({
        metodoPago: {
          in: params.metodosPago.map((metodo) => METODO_PAGO_TO_PRISMA[metodo]),
        },
      });
    }

    // ORIGEN

    if (params.origenesPago.length > 0) {
      conditions.push({
        origen: {
          in: params.origenesPago.map(
            (origen) => ORIGEN_PAGO_TO_PRISMA[origen],
          ),
        },
      });
    }

    // COBRADOR

    if (params.cobradorIds.length > 0) {
      conditions.push({
        cobradorId: {
          in: params.cobradorIds,
        },
      });
    }

    // RUTA

    if (params.rutaIds.length > 0) {
      conditions.push({
        facturaRuta: {
          is: {
            rutaId: {
              in: params.rutaIds,
            },
          },
        },
      });
    }

    // ZONA DE LA FACTURA

    if (params.zonaIds.length > 0) {
      conditions.push({
        facturaInternet: {
          facturacionZonaId: {
            in: params.zonaIds,
          },
        },
      });
    }

    // CLIENTE

    if (params.clienteId !== null) {
      conditions.push({
        clienteId: params.clienteId,
      });
    }

    return {
      AND: conditions,
    };
  }

  // WHERE - PAGOS DE COHORTE

  private buildPagosCohorteWhere(
    params: FacturacionReportePagoCohorteQueryParams,
  ): Prisma.PagoFacturaInternetWhereInput {
    const facturaConditions: Prisma.FacturaInternetWhereInput[] = [];

    // PERÍODO DE LA FACTURA

    facturaConditions.push({
      periodo: {
        gte: params.periodoDesde,
        lte: params.periodoHasta,
      },
    });

    // ESTADO ACTUAL DE LA FACTURA

    if (params.estadosFactura.length > 0) {
      facturaConditions.push({
        estadoFacturaInternet: {
          in: params.estadosFactura.map(
            (estado) => ESTADO_FACTURA_TO_PRISMA[estado],
          ),
        },
      });
    }

    // ZONA

    if (params.zonaIds.length > 0) {
      facturaConditions.push({
        facturacionZonaId: {
          in: params.zonaIds,
        },
      });
    }

    // CREADOR

    if (params.creadorIds.length > 0) {
      facturaConditions.push({
        creadorId: {
          in: params.creadorIds,
        },
      });
    }

    // CLIENTE

    if (params.clienteId !== null) {
      facturaConditions.push({
        clienteId: params.clienteId,
      });
    }

    return {
      /**
       * Sólo movimientos existentes hasta
       * la fecha exacta de generación del reporte.
       */
      fechaPago: {
        lte: params.fechaCorte,
      },

      facturaInternet: {
        AND: facturaConditions,
      },
    };
  }

  // WHERE - CARTERA ACTUAL

  private buildCarteraWhere(
    params: FacturacionReporteCarteraQueryParams,
  ): Prisma.FacturaInternetWhereInput {
    const conditions: Prisma.FacturaInternetWhereInput[] = [];

    /**
     * Fuente de verdad de la cartera:
     * saldo real actualmente pendiente.
     */
    conditions.push({
      saldoPendiente: {
        gt: 0,
      },
    });

    /**
     * Una factura anulada nunca debe convertirse
     * en cuenta por cobrar, aun si existe un dato
     * legacy incoherente con saldo > 0.
     */
    conditions.push({
      estadoFacturaInternet: {
        not: StateFacturaInternet.ANULADA,
      },
    });

    if (params.estadosFactura.length > 0) {
      const estadosValidos = params.estadosFactura
        .map((estado) => ESTADO_FACTURA_TO_PRISMA[estado])
        .filter((estado) => estado !== StateFacturaInternet.ANULADA);

      /**
       * Si únicamente se solicitó ANULADA,
       * cartera debe ser vacía.
       */
      if (estadosValidos.length === 0) {
        conditions.push({
          id: {
            in: [],
          },
        });
      } else {
        conditions.push({
          estadoFacturaInternet: {
            in: estadosValidos,
          },
        });
      }
    }

    if (params.zonaIds.length > 0) {
      conditions.push({
        facturacionZonaId: {
          in: params.zonaIds,
        },
      });
    }

    if (params.creadorIds.length > 0) {
      conditions.push({
        creadorId: {
          in: params.creadorIds,
        },
      });
    }

    if (params.clienteId !== null) {
      conditions.push({
        clienteId: params.clienteId,
      });
    }

    return {
      AND: conditions,
    };
  }

  // WHERE - PROYECCIÓN

  private buildProyeccionWhere(
    params: FacturacionReporteProyeccionQueryParams,
  ): Prisma.ClienteInternetWhereInput {
    const conditions: Prisma.ClienteInternetWhereInput[] = [
      {
        /**
         * Mismo concepto de cliente facturable
         * que ya utilizamos en el reporte
         * financiero de clientes.
         */
        isEliminado: false,

        desinstaladoEn: null,

        estadoCliente: EstadoCliente.ACTIVO,

        servicioInternetId: {
          not: null,
        },

        facturacionZonaId: {
          not: null,
        },
      },
    ];

    if (params.zonaIds.length > 0) {
      conditions.push({
        facturacionZonaId: {
          in: params.zonaIds,
        },
      });
    }

    if (params.clienteId !== null) {
      conditions.push({
        id: params.clienteId,
      });
    }

    return {
      AND: conditions,
    };
  }

  // FACTURAS YA EXISTENTES PARA PROYECCIÓN

  async findFacturasProyeccionExistentes(
    params: FacturacionReporteFacturasProyeccionQueryParams,
  ): Promise<FacturaReporteRow[]> {
    if (params.periodos.length === 0) {
      return [];
    }

    const conditions: Prisma.FacturaInternetWhereInput[] = [
      {
        periodo: {
          in: params.periodos,
        },
      },
    ];

    if (params.zonaIds.length > 0) {
      conditions.push({
        facturacionZonaId: {
          in: params.zonaIds,
        },
      });
    }

    if (params.clienteId !== null) {
      conditions.push({
        clienteId: params.clienteId,
      });
    }

    const facturas = await this.prisma.facturaInternet.findMany({
      where: {
        AND: conditions,
      },

      select: selectFacturaInternetReport,

      orderBy: [
        {
          periodo: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return facturas.map((factura) =>
      FacturacionReportePrismaMapper.facturaToRow(factura),
    );
  }
}
