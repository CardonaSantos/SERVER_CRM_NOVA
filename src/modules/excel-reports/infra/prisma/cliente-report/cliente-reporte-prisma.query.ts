import { Injectable, InternalServerErrorException } from '@nestjs/common';

import {
  EstadoCliente as PrismaEstadoCliente,
  EstadoDesinstalacionCliente,
  EstadoInstalacionCliente,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteReporteQueryPort } from '../../../domain/ports/cliente-reportes/cliente-reporte-query.port';
import { ClienteReporteFilters } from '../../../domain/filters/cliente-reporte/clientes-query-filters';
import { ClienteReporteRow } from '../../../domain/read-models/cliente-reportes/cliente-reporte-row';
import { ClienteReporteResumen } from '../../../domain/read-models/cliente-reportes/cliente-reporte-resumen';
import { ClienteReportePeriodoResumen } from '../../../domain/read-models/cliente-reportes/cliente-reporte-periodo';
import { ClienteReporteEvolucionMes } from '../../../domain/read-models/cliente-reportes/cliente-reporte-evolucion-mes';

import { selectClienteInternetReport } from './cliente-reporte-selects.query';
import { ClienteReportePrismaMapper } from './cliente-reporte-prisma.mapper';
import { ClienteReporteFinanciero } from '../../../domain/read-models/cliente-reportes/cliente-reporte-financiero';

const ESTADOS_CARTERA_ACTUAL: PrismaEstadoCliente[] = [
  PrismaEstadoCliente.ACTIVO,
  PrismaEstadoCliente.SUSPENDIDO,
  PrismaEstadoCliente.PENDIENTE_ACTIVO,
  PrismaEstadoCliente.EN_INSTALACION,
];

@Injectable()
export class ClienteReportePrismaQuery implements ClienteReporteQueryPort {
  private static readonly GT_OFFSET_MS = 6 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async findRows(filters: ClienteReporteFilters): Promise<ClienteReporteRow[]> {
    const where = this.buildClienteWhere(filters);

    const clientes = await this.prisma.clienteInternet.findMany({
      where,

      select: selectClienteInternetReport,

      orderBy: [
        {
          nombre: 'asc',
        },
        {
          apellidos: 'asc',
        },
      ],
    });

    return clientes.map((cliente) => ClienteReportePrismaMapper.toRow(cliente));
  }

  async getResumen(
    filters: ClienteReporteFilters,
  ): Promise<ClienteReporteResumen> {
    const clienteWhere = this.buildClienteResumenGlobalWhere(filters);

    const [
      totalClientes,

      carteraActual,

      clientesPorEstado,

      clientesPorCobranza,

      instalacionesPorEstado,

      desinstalacionesPorEstado,
    ] = await Promise.all([
      this.countClientes(clienteWhere),

      this.countCarteraActual(clienteWhere),

      this.groupClientesByEstado(clienteWhere),

      this.groupClientesByCobranza(clienteWhere),

      this.groupInstalacionesByEstado(filters, clienteWhere),

      this.groupDesinstalacionesByEstado(filters, clienteWhere),
    ]);

    const instalaciones = instalacionesPorEstado.map((item) => ({
      categoria: item.estado,
      total: item._count._all,
    }));

    const desinstalaciones = desinstalacionesPorEstado.map((item) => ({
      categoria: item.estado,
      total: item._count._all,
    }));

    return {
      totalClientes,

      carteraActual,

      porEstadoCliente: clientesPorEstado.map((item) => ({
        categoria: item.estadoCliente,
        total: item._count._all,
      })),

      porEstadoCobranza: clientesPorCobranza.map((item) => ({
        categoria: item.estadoCobranza,
        total: item._count._all,
      })),

      instalaciones: {
        total: this.sumTotals(instalaciones),
        porEstado: instalaciones,
      },

      desinstalaciones: {
        total: this.sumTotals(desinstalaciones),
        porEstado: desinstalaciones,
      },
    };
  }

  async getResumenFinanciero(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
    etiqueta: string,
    fechaCorte: Date,
  ): Promise<ClienteReporteFinanciero> {
    /**
     * Para el bloque financiero no usamos:
     *
     * - estadoCliente recibido como filtro;
     * - estadoCobranza recibido como filtro;
     * - fechas de creación.
     *
     * Cada métrica financiera aplica posteriormente
     * su propio estado operativo cuando corresponde.
     */
    const clienteSegmentoWhere = this.buildClienteOperacionWhere(filters);

    /**
     * Ejemplo:
     *
     * Agosto 2026 -> "202608"
     *
     * Esta es la clave del ciclo de facturación.
     */
    const periodoObjetivo = this.periodoDesdeInicioMes(desde);

    const clienteFacturableWhere: Prisma.ClienteInternetWhereInput = {
      AND: [
        clienteSegmentoWhere,

        {
          isEliminado: false,

          desinstaladoEn: null,

          estadoCliente: PrismaEstadoCliente.ACTIVO,

          servicioInternetId: {
            not: null,
          },
        },
      ],
    };

    const clienteSuspendidoWhere: Prisma.ClienteInternetWhereInput = {
      AND: [
        clienteSegmentoWhere,

        {
          isEliminado: false,

          desinstaladoEn: null,

          estadoCliente: PrismaEstadoCliente.SUSPENDIDO,

          servicioInternetId: {
            not: null,
          },
        },
      ],
    };

    const clienteFinancieroSelect = {
      id: true,

      servicioInternetId: true,

      facturacionZonaId: true,

      servicioInternet: {
        select: {
          id: true,
          nombre: true,
          precio: true,
        },
      },

      facturacionZona: {
        select: {
          id: true,

          diaGeneracionFactura: true,

          diaPago: true,
        },
      },
    } satisfies Prisma.ClienteInternetSelect;

    const facturaFinancieraSelect = {
      id: true,

      clienteId: true,

      facturacionZonaId: true,

      periodo: true,

      montoPago: true,

      saldoPendiente: true,

      estadoFacturaInternet: true,

      cliente: {
        select: {
          id: true,

          nombre: true,
          apellidos: true,

          estadoCliente: true,
          estadoCobranza: true,

          servicioInternetId: true,

          servicioInternet: {
            select: {
              nombre: true,
            },
          },
        },
      },
    } satisfies Prisma.FacturaInternetSelect;

    const [
      clientesFacturables,
      clientesSuspendidos,
      facturasPeriodo,
      facturasAnterioresPendientes,
      pagosDuranteMes,
    ] = await Promise.all([
      /**
       * Snapshot ACTUAL de clientes facturables.
       *
       * Se usa para:
       *
       * - potencial mensual actual;
       * - cartera por plan;
       * - proyección todavía no generada.
       */
      this.prisma.clienteInternet.findMany({
        where: clienteFacturableWhere,

        select: clienteFinancieroSelect,
      }),

      /**
       * Snapshot ACTUAL de clientes suspendidos.
       *
       * Únicamente para calcular potencial
       * mensual suspendido.
       */
      this.prisma.clienteInternet.findMany({
        where: clienteSuspendidoWhere,

        select: clienteFinancieroSelect,
      }),

      /**
       * TODAS las facturas reales del período,
       * incluso ANULADA.
       *
       * Las anuladas no sumarán dinero, pero
       * necesitamos conocer su existencia para
       * no inventar una futura factura.
       */
      this.prisma.facturaInternet.findMany({
        where: {
          periodo: periodoObjetivo,

          cliente: {
            is: clienteSegmentoWhere,
          },
        },

        select: facturaFinancieraSelect,
      }),

      /**
       * Deuda de ciclos anteriores.
       *
       * Solamente necesitamos traer:
       *
       * - saldo positivo;
       * - saldo negativo (error);
       * - saldo null (error).
       *
       * Las facturas en cero no son deuda.
       */
      this.prisma.facturaInternet.findMany({
        where: {
          periodo: {
            lt: periodoObjetivo,
          },

          estadoFacturaInternet: {
            not: StateFacturaInternet.ANULADA,
          },

          OR: [
            {
              saldoPendiente: {
                gt: 0,
              },
            },

            {
              saldoPendiente: {
                lt: 0,
              },
            },

            {
              saldoPendiente: null,
            },
          ],

          cliente: {
            is: clienteSegmentoWhere,
          },
        },

        select: facturaFinancieraSelect,
      }),

      /**
       * Dinero realmente registrado como
       * PagoFacturaInternet durante el mes
       * calendario evaluado.
       *
       * No importa a qué período pertenecía
       * la factura pagada.
       */
      this.prisma.pagoFacturaInternet.aggregate({
        where: {
          fechaPago: {
            gte: desde,
            lt: hastaExclusivo,
          },

          cliente: {
            is: clienteSegmentoWhere,
          },
        },

        _sum: {
          montoPagado: true,
        },
      }),
    ]);

    // =====================================================
    // 1. POTENCIAL ACTUAL + CARTERA POR PLAN
    // =====================================================

    interface PlanAccumulator {
      servicioInternetId: number;

      plan: string;

      precioCentavos: number;

      clientesFacturables: number;
    }

    const planesMap = new Map<number, PlanAccumulator>();

    let potencialMensualActualCentavos = 0;

    for (const cliente of clientesFacturables) {
      const servicio = cliente.servicioInternet;

      if (!servicio) {
        throw new InternalServerErrorException(
          `Cliente facturable ${cliente.id} sin relación ServicioInternet.`,
        );
      }

      const precioCentavos = this.moneyToCents(
        servicio.precio,
        `ServicioInternet ${servicio.id} precio`,
      );

      potencialMensualActualCentavos += precioCentavos;

      const planActual = planesMap.get(servicio.id);

      if (planActual) {
        planActual.clientesFacturables += 1;

        continue;
      }

      planesMap.set(servicio.id, {
        servicioInternetId: servicio.id,

        plan: servicio.nombre,

        precioCentavos,

        clientesFacturables: 1,
      });
    }

    const carteraPorPlan = [...planesMap.values()]
      .map((item) => {
        const potencialCentavos =
          item.precioCentavos * item.clientesFacturables;

        return {
          servicioInternetId: item.servicioInternetId,

          plan: item.plan,

          precio: this.centsToMoney(item.precioCentavos),

          clientesFacturables: item.clientesFacturables,

          potencialMensual: this.centsToMoney(potencialCentavos),

          porcentajePotencial: this.calculatePercentage(
            potencialCentavos,
            potencialMensualActualCentavos,
          ),
        };
      })
      .sort((a, b) => {
        if (b.potencialMensual !== a.potencialMensual) {
          return b.potencialMensual - a.potencialMensual;
        }

        return a.plan.localeCompare(b.plan, 'es');
      });

    // =====================================================
    // 2. POTENCIAL SUSPENDIDO
    // =====================================================

    let potencialSuspendidoCentavos = 0;

    for (const cliente of clientesSuspendidos) {
      const servicio = cliente.servicioInternet;

      if (!servicio) {
        throw new InternalServerErrorException(
          `Cliente suspendido ${cliente.id} sin relación ServicioInternet.`,
        );
      }

      potencialSuspendidoCentavos += this.moneyToCents(
        servicio.precio,
        `ServicioInternet ${servicio.id} precio`,
      );
    }

    // =====================================================
    // 3. FACTURAS REALES DEL PERÍODO
    // =====================================================

    const facturasNoAnuladas = facturasPeriodo.filter(
      (factura) =>
        factura.estadoFacturaInternet !== StateFacturaInternet.ANULADA,
    );

    const clientesConFacturaReal = new Set<number>();

    const clientesConFacturaAnulada = new Set<number>();

    for (const factura of facturasPeriodo) {
      if (factura.estadoFacturaInternet === StateFacturaInternet.ANULADA) {
        clientesConFacturaAnulada.add(factura.clienteId);

        continue;
      }

      clientesConFacturaReal.add(factura.clienteId);
    }

    let facturacionEmitidaCentavos = 0;

    let saldoPendienteMesCentavos = 0;

    let aplicadoFacturasMesCentavos = 0;

    // =====================================================
    // DEUDORES
    // =====================================================

    interface DeudorAccumulator {
      clienteId: number;

      cliente: string;

      estadoCliente: (typeof facturasPeriodo)[number]['cliente']['estadoCliente'];

      estadoCobranza: (typeof facturasPeriodo)[number]['cliente']['estadoCobranza'];

      servicioInternetId: number | null;

      plan: string | null;

      pendienteMesCentavos: number;

      deudaAnteriorCentavos: number;

      facturasPendientes: number;
    }

    const deudoresMap = new Map<number, DeudorAccumulator>();

    type ClienteFactura = (typeof facturasPeriodo)[number]['cliente'];

    const acumularDeuda = (
      cliente: ClienteFactura,
      pendienteMesCentavos: number,
      deudaAnteriorCentavos: number,
    ): void => {
      const existente = deudoresMap.get(cliente.id);

      if (existente) {
        existente.facturasPendientes += 1;

        existente.pendienteMesCentavos += pendienteMesCentavos;

        existente.deudaAnteriorCentavos += deudaAnteriorCentavos;

        return;
      }

      const nombreCompleto =
        `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim();

      deudoresMap.set(cliente.id, {
        clienteId: cliente.id,

        cliente: nombreCompleto || `Cliente #${cliente.id}`,

        estadoCliente: cliente.estadoCliente,

        estadoCobranza: cliente.estadoCobranza,

        servicioInternetId: cliente.servicioInternetId,

        plan: cliente.servicioInternet?.nombre ?? null,

        facturasPendientes: 1,

        pendienteMesCentavos,

        deudaAnteriorCentavos,
      });
    };

    for (const factura of facturasNoAnuladas) {
      const montoCentavos = this.moneyToCents(
        factura.montoPago,
        `Factura ${factura.id} montoPago`,
      );

      const saldoCentavos = this.moneyToCents(
        factura.saldoPendiente,
        `Factura ${factura.id} saldoPendiente`,
      );

      /**
       * Según el flujo actual de pagos,
       * saldoPendiente nunca debería ser
       * superior a montoPago.
       *
       * Si ocurre, preferimos detener el
       * reporte antes que publicar una
       * cantidad monetaria falsa.
       */
      if (saldoCentavos > montoCentavos) {
        throw new InternalServerErrorException(
          `Factura ${factura.id} inconsistente: saldoPendiente es mayor que montoPago.`,
        );
      }

      facturacionEmitidaCentavos += montoCentavos;

      saldoPendienteMesCentavos += saldoCentavos;

      aplicadoFacturasMesCentavos += montoCentavos - saldoCentavos;

      if (saldoCentavos > 0) {
        acumularDeuda(
          factura.cliente,

          saldoCentavos,

          0,
        );
      }
    }

    // =====================================================
    // 4. DEUDA ANTERIOR REAL
    // =====================================================

    let deudaAnteriorCentavos = 0;

    for (const factura of facturasAnterioresPendientes) {
      const saldoCentavos = this.moneyToCents(
        factura.saldoPendiente,
        `Factura ${factura.id} saldoPendiente`,
      );

      /**
       * La query también trae negativos
       * para poder detectarlos.
       *
       * moneyToCents ya rechaza números
       * negativos, por lo que nunca
       * continuaremos con datos corruptos.
       */
      if (saldoCentavos <= 0) {
        continue;
      }

      deudaAnteriorCentavos += saldoCentavos;

      acumularDeuda(
        factura.cliente,

        0,

        saldoCentavos,
      );
    }

    // =====================================================
    // 5. PROYECCIÓN AÚN NO GENERADA
    // =====================================================

    let facturacionPendienteProgramadaCentavos = 0;

    let clientesPendientesProgramados = 0;

    let facturacionRevisarCentavos = 0;

    let clientesRevisar = 0;

    for (const cliente of clientesFacturables) {
      /**
       * Si existe al menos una factura REAL
       * y no anulada para el cliente y período,
       * el cliente ya está facturado.
       *
       * No proyectamos una segunda factura.
       */
      if (clientesConFacturaReal.has(cliente.id)) {
        continue;
      }

      const servicio = cliente.servicioInternet;

      if (!servicio) {
        throw new InternalServerErrorException(
          `Cliente facturable ${cliente.id} sin relación ServicioInternet.`,
        );
      }

      const precioCentavos = this.moneyToCents(
        servicio.precio,
        `ServicioInternet ${servicio.id} precio`,
      );

      /**
       * Si existe una factura ANULADA del
       * período, no suponemos automáticamente
       * que debe volver a generarse.
       *
       * Lo dejamos como caso para revisar.
       */
      if (clientesConFacturaAnulada.has(cliente.id)) {
        facturacionRevisarCentavos += precioCentavos;

        clientesRevisar += 1;

        continue;
      }

      const zona = cliente.facturacionZona;

      /**
       * Sin zona no podemos afirmar en qué
       * fecha o período debería generarse.
       *
       * No inventamos la obligación.
       */
      if (!zona) {
        facturacionRevisarCentavos += precioCentavos;

        clientesRevisar += 1;

        continue;
      }

      const fechaGeneracion = this.resolveFechaGeneracionParaPeriodo(
        desde,

        periodoObjetivo,

        zona.diaGeneracionFactura,

        zona.diaPago,
      );

      /**
       * Una configuración como día 31 en
       * un mes donde ese día no existe puede
       * provocar que el cron no tenga un evento
       * real capaz de producir el período.
       *
       * Se trata como revisión, no como deuda.
       */
      if (!fechaGeneracion) {
        facturacionRevisarCentavos += precioCentavos;

        clientesRevisar += 1;

        continue;
      }

      /**
       * El evento real de generación todavía
       * está en el futuro:
       *
       * sí podemos tratarlo como una proyección
       * programada según el snapshot actual.
       */
      if (fechaGeneracion.getTime() > fechaCorte.getTime()) {
        facturacionPendienteProgramadaCentavos += precioCentavos;

        clientesPendientesProgramados += 1;

        continue;
      }

      /**
       * La fecha ya pasó y no existe factura.
       *
       * No sabemos si el cliente ya era
       * facturable en aquel instante.
       *
       * Por eso NO sumamos este monto a la
       * facturación esperada.
       */
      facturacionRevisarCentavos += precioCentavos;

      clientesRevisar += 1;
    }

    // =====================================================
    // 6. RECAUDACIÓN REAL DURANTE EL MES
    // =====================================================

    const recaudadoDuranteMesCentavos = this.moneyToCents(
      pagosDuranteMes._sum.montoPagado ?? 0,

      'Recaudación del período',
    );

    // =====================================================
    // 7. TOP DEUDORES
    // =====================================================

    const topClientesSaldoPendiente = [...deudoresMap.values()]
      .map((item) => {
        const totalCentavos =
          item.pendienteMesCentavos + item.deudaAnteriorCentavos;

        return {
          clienteId: item.clienteId,

          cliente: item.cliente,

          estadoCliente: item.estadoCliente,

          estadoCobranza: item.estadoCobranza,

          servicioInternetId: item.servicioInternetId,

          plan: item.plan,

          pendienteMesActual: this.centsToMoney(item.pendienteMesCentavos),

          deudaAnterior: this.centsToMoney(item.deudaAnteriorCentavos),

          totalPendiente: this.centsToMoney(totalCentavos),

          facturasPendientes: item.facturasPendientes,
        };
      })
      .sort((a, b) => {
        if (b.totalPendiente !== a.totalPendiente) {
          return b.totalPendiente - a.totalPendiente;
        }

        return a.cliente.localeCompare(b.cliente, 'es');
      })
      .slice(0, 10);

    // =====================================================
    // 8. RESULTADO
    // =====================================================

    const facturacionEsperadaCentavos =
      facturacionEmitidaCentavos + facturacionPendienteProgramadaCentavos;

    const cuentasPorCobrarCentavos =
      saldoPendienteMesCentavos + deudaAnteriorCentavos;

    return {
      periodo: {
        etiqueta,

        desde,

        hastaExclusivo,
      },

      clientesFacturablesActuales: clientesFacturables.length,

      potencialMensualActual: this.centsToMoney(potencialMensualActualCentavos),

      ingresoPotencialPromedioCliente:
        clientesFacturables.length > 0
          ? this.centsToMoney(
              Math.round(
                potencialMensualActualCentavos / clientesFacturables.length,
              ),
            )
          : 0,

      potencialMensualSuspendido: this.centsToMoney(
        potencialSuspendidoCentavos,
      ),

      facturacionEsperadaMes: this.centsToMoney(facturacionEsperadaCentavos),

      facturacionEmitidaMes: this.centsToMoney(facturacionEmitidaCentavos),

      facturasEmitidasMes: facturasNoAnuladas.length,

      facturacionPendienteGenerarProgramadaMes: this.centsToMoney(
        facturacionPendienteProgramadaCentavos,
      ),

      clientesPendientesGenerarProgramadaMes: clientesPendientesProgramados,

      facturacionSinFacturaRevisarMes: this.centsToMoney(
        facturacionRevisarCentavos,
      ),

      clientesSinFacturaRevisarMes: clientesRevisar,

      aplicadoFacturasMes: this.centsToMoney(aplicadoFacturasMesCentavos),

      saldoPendienteFacturasMes: this.centsToMoney(saldoPendienteMesCentavos),

      porcentajeCobranzaFacturasMes: this.calculatePercentage(
        aplicadoFacturasMesCentavos,
        facturacionEmitidaCentavos,
      ),

      recaudadoDuranteMes: this.centsToMoney(recaudadoDuranteMesCentavos),

      deudaAnterior: this.centsToMoney(deudaAnteriorCentavos),

      cuentasPorCobrarAlCorte: this.centsToMoney(cuentasPorCobrarCentavos),

      carteraPorPlan,

      topClientesSaldoPendiente,
    };
  }

  private countClientes(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.count({
      where,
    });
  }

  private countCarteraActual(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.count({
      where: {
        AND: [
          where,

          {
            isEliminado: false,

            estadoCliente: {
              in: ESTADOS_CARTERA_ACTUAL,
            },
          },
        ],
      },
    });
  }

  private groupClientesByEstado(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.groupBy({
      by: ['estadoCliente'],

      where,

      _count: {
        _all: true,
      },
    });
  }

  private groupClientesByCobranza(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.groupBy({
      by: ['estadoCobranza'],

      where,

      _count: {
        _all: true,
      },
    });
  }

  private groupInstalacionesByEstado(
    filters: ClienteReporteFilters,
    clienteWhere: Prisma.ClienteInternetWhereInput,
  ) {
    return this.prisma.clienteInstalacion.groupBy({
      by: ['estado'],

      where: {
        cliente: {
          is: clienteWhere,
        },
      },

      _count: {
        _all: true,
      },
    });
  }

  private groupDesinstalacionesByEstado(
    filters: ClienteReporteFilters,
    clienteWhere: Prisma.ClienteInternetWhereInput,
  ) {
    return this.prisma.clienteDesinstalacion.groupBy({
      by: ['estado'],

      where: {
        cliente: {
          is: clienteWhere,
        },
      },

      _count: {
        _all: true,
      },
    });
  }

  private sumTotals(
    items: Array<{
      total: number;
    }>,
  ): number {
    return items.reduce((accumulator, item) => accumulator + item.total, 0);
  }

  private buildClienteWhere(
    filters: ClienteReporteFilters,
  ): Prisma.ClienteInternetWhereInput {
    const where: Prisma.ClienteInternetWhereInput = {};

    if (!filters.incluirEliminados) {
      where.isEliminado = false;
    }

    if (filters.estado) {
      where.estadoCliente = filters.estado;
    }

    if (filters.estadoCobranza) {
      where.estadoCobranza = filters.estadoCobranza;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.sectorId) {
      where.sectorId = filters.sectorId;
    }

    if (filters.municipioId) {
      where.municipioId = filters.municipioId;
    }

    if (filters.departamentoId) {
      where.departamentoId = filters.departamentoId;
    }

    if (filters.fechaCreadoDesde || filters.fechaCreadoHasta) {
      where.creadoEn = {
        ...(filters.fechaCreadoDesde
          ? {
              gte: filters.fechaCreadoDesde,
            }
          : {}),

        ...(filters.fechaCreadoHasta
          ? {
              lte: filters.fechaCreadoHasta,
            }
          : {}),
      };
    }

    const search = filters.search?.trim();

    if (search) {
      where.OR = [
        {
          nombre: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          apellidos: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          searchNombre: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          telefono: {
            contains: search,
          },
        },
        {
          dpi: {
            contains: search,
          },
        },
      ];
    }

    return where;
  }

  private buildClienteResumenGlobalWhere(
    filters: ClienteReporteFilters,
  ): Prisma.ClienteInternetWhereInput {
    const where: Prisma.ClienteInternetWhereInput = {};

    if (!filters.incluirEliminados) {
      where.isEliminado = false;
    }

    return where;
  }

  /**
   * CONSTRUCTOR DE OPERACIONES
   * @param filters
   * @returns
   */
  private buildClienteOperacionWhere(
    filters: ClienteReporteFilters,
  ): Prisma.ClienteInternetWhereInput {
    const where: Prisma.ClienteInternetWhereInput = {};

    /**
     * Solamente dimensiones relativamente
     * estables.
     *
     * NO :
     * - estadoCliente
     * - estadoCobranza
     * - fechas de creación del cliente
     * - isEliminado
     *
     */

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.sectorId) {
      where.sectorId = filters.sectorId;
    }

    if (filters.municipioId) {
      where.municipioId = filters.municipioId;
    }

    if (filters.departamentoId) {
      where.departamentoId = filters.departamentoId;
    }

    const search = filters.search?.trim();

    if (search) {
      where.OR = [
        {
          nombre: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          apellidos: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          searchNombre: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          telefono: {
            contains: search,
          },
        },

        {
          dpi: {
            contains: search,
          },
        },
      ];
    }

    return where;
  }

  /**
   * CONSTRUCTOR DE RESUMEN PERIODOS
   * @param filters
   * @param desde
   * @param hastaExclusivo
   * @param etiqueta
   * @returns
   */
  async getResumenPeriodo(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
    etiqueta: string,
  ): Promise<ClienteReportePeriodoResumen> {
    const clienteWhere = this.buildClienteOperacionWhere(filters);

    const [instalacionesPorEstado, desinstalacionesPorEstado, altas, bajas] =
      await Promise.all([
        this.prisma.clienteInstalacion.groupBy({
          by: ['estado'],

          where: {
            creadoEn: {
              gte: desde,
              lt: hastaExclusivo,
            },

            cliente: {
              is: clienteWhere,
            },
          },

          _count: {
            _all: true,
          },
        }),

        this.prisma.clienteDesinstalacion.groupBy({
          by: ['estado'],

          where: {
            creadoEn: {
              gte: desde,
              lt: hastaExclusivo,
            },

            cliente: {
              is: clienteWhere,
            },
          },

          _count: {
            _all: true,
          },
        }),

        /**
         * ALTA:
         * instalación COMPLETADA cuya activación
         * ocurrió dentro del período.
         *
         * Para registros legacy sin
         * fechaActivacionServicio usamos
         * fechaFinalizacion como fallback.
         */
        this.prisma.clienteInstalacion.count({
          where: {
            estado: EstadoInstalacionCliente.COMPLETADA,

            cliente: {
              is: clienteWhere,
            },

            OR: [
              {
                fechaActivacionServicio: {
                  gte: desde,
                  lt: hastaExclusivo,
                },
              },
              {
                fechaActivacionServicio: null,

                fechaFinalizacion: {
                  gte: desde,
                  lt: hastaExclusivo,
                },
              },
            ],
          },
        }),

        /**
         * BAJA:
         * desinstalación completada dentro
         * del período.
         */
        this.prisma.clienteDesinstalacion.count({
          where: {
            estado: EstadoDesinstalacionCliente.COMPLETADA,

            fechaFinalizacion: {
              gte: desde,
              lt: hastaExclusivo,
            },

            cliente: {
              is: clienteWhere,
            },
          },
        }),
      ]);

    const instalaciones = instalacionesPorEstado.map((item) => ({
      categoria: item.estado,
      total: item._count._all,
    }));

    const desinstalaciones = desinstalacionesPorEstado.map((item) => ({
      categoria: item.estado,
      total: item._count._all,
    }));

    return {
      etiqueta,

      desde,
      hastaExclusivo,

      altas,

      bajas,

      crecimientoNeto: altas - bajas,

      instalaciones: {
        registradas: this.sumTotals(instalaciones),

        porEstadoActual: instalaciones,
      },

      desinstalaciones: {
        registradas: this.sumTotals(desinstalaciones),

        porEstadoActual: desinstalaciones,
      },
    };
  }

  private monthKey(date: Date): string {
    const gtDate = new Date(
      date.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const year = gtDate.getUTCFullYear();

    const month = gtDate.getUTCMonth() + 1;

    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /**
   *
   *
   * @param desde
   * @param hastaExclusivo
   * @returns
   */
  private createMonthBuckets(
    desde: Date,
    hastaExclusivo: Date,
  ): Map<string, ClienteReporteEvolucionMes> {
    const result = new Map<string, ClienteReporteEvolucionMes>();

    const desdeGt = new Date(
      desde.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const hastaGt = new Date(
      hastaExclusivo.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const cursor = new Date(
      Date.UTC(desdeGt.getUTCFullYear(), desdeGt.getUTCMonth(), 1),
    );

    const limit = new Date(
      Date.UTC(hastaGt.getUTCFullYear(), hastaGt.getUTCMonth(), 1),
    );

    while (cursor < limit) {
      const anio = cursor.getUTCFullYear();

      const mes = cursor.getUTCMonth() + 1;

      const key = `${anio}-${String(mes).padStart(2, '0')}`;

      const etiqueta = new Intl.DateTimeFormat('es-GT', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(cursor);

      result.set(key, {
        anio,
        mes,

        etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),

        altas: 0,
        bajas: 0,
        crecimientoNeto: 0,
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return result;
  }

  async getEvolucionMensual(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
  ): Promise<ClienteReporteEvolucionMes[]> {
    const clienteWhere = this.buildClienteOperacionWhere(filters);

    const [instalaciones, desinstalaciones] = await Promise.all([
      this.prisma.clienteInstalacion.findMany({
        where: {
          estado: EstadoInstalacionCliente.COMPLETADA,

          cliente: {
            is: clienteWhere,
          },

          OR: [
            {
              fechaActivacionServicio: {
                gte: desde,
                lt: hastaExclusivo,
              },
            },

            {
              fechaActivacionServicio: null,

              fechaFinalizacion: {
                gte: desde,
                lt: hastaExclusivo,
              },
            },
          ],
        },

        select: {
          fechaActivacionServicio: true,
          fechaFinalizacion: true,
        },
      }),

      this.prisma.clienteDesinstalacion.findMany({
        where: {
          estado: EstadoDesinstalacionCliente.COMPLETADA,

          fechaFinalizacion: {
            gte: desde,
            lt: hastaExclusivo,
          },

          cliente: {
            is: clienteWhere,
          },
        },

        select: {
          fechaFinalizacion: true,
        },
      }),
    ]);

    const meses = this.createMonthBuckets(desde, hastaExclusivo);

    for (const instalacion of instalaciones) {
      const fecha =
        instalacion.fechaActivacionServicio ?? instalacion.fechaFinalizacion;

      if (!fecha) {
        continue;
      }

      const key = this.monthKey(fecha);

      const mes = meses.get(key);

      if (mes) {
        mes.altas += 1;
      }
    }

    for (const desinstalacion of desinstalaciones) {
      const fecha = desinstalacion.fechaFinalizacion;

      if (!fecha) {
        continue;
      }

      const key = this.monthKey(fecha);

      const mes = meses.get(key);

      if (mes) {
        mes.bajas += 1;
      }
    }

    return Array.from(meses.values()).map((mes) => ({
      ...mes,

      crecimientoNeto: mes.altas - mes.bajas,
    }));
  }

  /**
   * Obtiene YYYYMM desde el inicio mensual
   * generado por ClienteReportePeriodosFactory.
   *
   * `desde` representa medianoche Guatemala,
   * almacenada como instante UTC.
   */
  private periodoDesdeInicioMes(desde: Date): string {
    const local = new Date(
      desde.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const year = local.getUTCFullYear();

    const month = local.getUTCMonth() + 1;

    return `${year}${String(month).padStart(2, '0')}`;
  }

  /**
   * Resuelve la fecha REAL en la que el cron
   * debería producir un período específico.
   *
   * Un período puede generarse:
   *
   * - durante el mismo mes;
   * - durante el mes anterior.
   *
   * Esto depende de diaGeneracionFactura y diaPago.
   */
  private resolveFechaGeneracionParaPeriodo(
    desdePeriodo: Date,
    periodoObjetivo: string,
    diaGeneracionFactura: number,
    diaPago: number,
  ): Date | null {
    if (
      !Number.isInteger(diaGeneracionFactura) ||
      diaGeneracionFactura < 1 ||
      diaGeneracionFactura > 31
    ) {
      return null;
    }

    if (!Number.isInteger(diaPago) || diaPago < 1 || diaPago > 31) {
      return null;
    }

    const localPeriodo = new Date(
      desdePeriodo.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const year = localPeriodo.getUTCFullYear();

    const month = localPeriodo.getUTCMonth();

    /**
     * calcularPeriodo() solamente puede
     * devolver:
     *
     * - el mes del evento;
     * - el mes siguiente.
     *
     * Por eso sólo necesitamos evaluar:
     *
     * 1. generación en mes anterior;
     * 2. generación en mes objetivo.
     */
    const candidatos = [
      this.buildFechaCronGeneracion(year, month - 1, diaGeneracionFactura),

      this.buildFechaCronGeneracion(year, month, diaGeneracionFactura),
    ];

    for (const candidato of candidatos) {
      if (!candidato) {
        continue;
      }

      const periodoGenerado = this.calcularPeriodoEnFecha(candidato, diaPago);

      if (periodoGenerado === periodoObjetivo) {
        return candidato;
      }
    }

    return null;
  }

  /**
   * Construye el instante exacto del cron:
   *
   * 10:00 America/Guatemala.
   *
   * Guatemala = UTC-6 y no utiliza DST.
   *
   * Si el día configurado no existe en
   * ese mes, retorna null porque el cron
   * actual tampoco llegará a ejecutarse
   * en dicho día.
   */
  private buildFechaCronGeneracion(
    year: number,
    month: number,
    day: number,
  ): Date | null {
    /**
     * Normalizamos year/month mediante Date.UTC.
     *
     * Ejemplo:
     * month = -1
     * pasa correctamente a diciembre
     * del año anterior.
     */
    const monthAnchor = new Date(Date.UTC(year, month, 1));

    const normalizedYear = monthAnchor.getUTCFullYear();

    const normalizedMonth = monthAnchor.getUTCMonth();

    const lastDay = new Date(
      Date.UTC(normalizedYear, normalizedMonth + 1, 0),
    ).getUTCDate();

    if (day < 1 || day > lastDay) {
      return null;
    }

    /**
     * Cron:
     *
     * @Cron('0 10 * * *', {
     *   timeZone: 'America/Guatemala'
     * })
     *
     * 10:00 GT = 16:00 UTC.
     */
    return new Date(
      Date.UTC(normalizedYear, normalizedMonth, day, 16, 0, 0, 0),
    );
  }

  /**
   * Replica la decisión de calcularPeriodo()
   * del módulo real de facturación.
   *
   * NO crea factura.
   * Únicamente reproduce qué YYYYMM
   * produciría la zona en esa fecha.
   */
  private calcularPeriodoEnFecha(
    fechaGeneracionUtc: Date,
    diaPago: number,
  ): string {
    const local = new Date(
      fechaGeneracionUtc.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const year = local.getUTCFullYear();

    const month = local.getUTCMonth();

    const currentDay = local.getUTCDate();

    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    /**
     * Mismo comportamiento que:
     *
     * Math.min(zona.diaPago, daysInMonth)
     */
    const validPaymentDay = Math.min(diaPago, lastDay);

    /**
     * Mismo comportamiento que:
     *
     * base.isBefore(hoy, 'day')
     *   ? base.add(1, 'month')
     *   : base
     */
    const targetMonth = validPaymentDay < currentDay ? month + 1 : month;

    const targetMonthAnchor = new Date(Date.UTC(year, targetMonth, 1));

    const targetYear = targetMonthAnchor.getUTCFullYear();

    const normalizedTargetMonth = targetMonthAnchor.getUTCMonth() + 1;

    return `${targetYear}${String(normalizedTargetMonth).padStart(2, '0')}`;
  }

  /**
   * Toda la aritmética financiera interna
   * se realiza en centavos.
   *
   * Evitamos operaciones como:
   *
   * 0.1 + 0.2
   *
   * directamente sobre Float.
   */
  private moneyToCents(
    value: number | null | undefined,
    context: string,
  ): number {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      throw new InternalServerErrorException(
        `${context}: valor monetario inválido o ausente.`,
      );
    }

    if (value < 0) {
      throw new InternalServerErrorException(
        `${context}: valor monetario negativo (${value}).`,
      );
    }

    return Math.round((value + Number.EPSILON) * 100);
  }

  private centsToMoney(cents: number): number {
    return cents / 100;
  }

  private calculatePercentage(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    /**
     * Devuelve porcentaje con
     * dos decimales.
     *
     * Ejemplo:
     * 52.37
     */
    return Math.round((value * 10000) / total) / 100;
  }
}
