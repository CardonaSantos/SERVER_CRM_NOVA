import { XlsxDocument, XlsxTable } from '../../domain/ports/xlsx-writer.port';

import { FacturacionReporteData } from '../../domain/read-models/facturacion-reporte/facturacion-reporte-data';

import { PagoReporteRow } from '../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturaReporteRow } from '../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { dayjs } from 'src/Utils/dayjs.config';

import { TZ } from 'src/Utils/tzgt';

// AUXILIAR DE PAGOS POR FACTURA

interface FacturaPagoResumen {
  cantidad: number;

  ultimoPago: Date | null;
}

export class FacturacionReporteXlsxMapper {
  private static readonly EMPTY = '—';

  // DOCUMENT

  static toDocument(data: FacturacionReporteData): XlsxDocument {
    return {
      filename: this.buildFilename(data),
      timezone: TZ,
      sheets: [
        {
          name: '01 Resumen',

          title: 'Resumen de facturación y cobranza',

          tables: [
            this.buildReporteInfoTable(data),

            this.buildFiltrosTable(data),

            this.buildResumenFacturasTable(data),

            this.buildResumenMontosFacturasTable(data),

            this.buildResumenCobrosTable(data),

            this.buildResumenCarteraTable(data),

            this.buildResumenProyeccionTable(data),

            this.buildTopPagadoresTable(data),

            this.buildTopDeudoresTable(data),
          ],
        },

        {
          name: '02 Evolución',

          title: 'Evolución de facturación y cobranza',

          tables: [
            this.buildEvolucionFacturacionTable(data),

            this.buildEvolucionRecaudacionTable(data),

            this.buildRecuperacionCohortesTable(data),
          ],
        },

        {
          name: '03 Cartera',

          title: 'Cartera pendiente actual',

          tables: [
            this.buildAgingTable(data),

            this.buildCarteraZonaTable(data),

            this.buildCarteraClientesTable(data),
          ],
        },

        {
          name: '04 Zonas',

          title: 'Facturación y cobranza por zona',

          tables: [
            this.buildZonaFacturacionTable(data),

            this.buildZonaRecaudacionTable(data),

            this.buildZonaProyeccionTable(data),
          ],
        },

        {
          name: '05 Rutas y cobradores',

          title: 'Cobranza operativa',

          tables: [
            this.buildCobradoresTable(data),

            this.buildRutasTable(data),

            this.buildOrigenesTable(data),

            this.buildMetodosTable(data),

            this.buildCobranzaControlTable(data),
          ],
        },

        {
          name: '06 Facturas',

          title: 'Detalle de facturas',

          tables: [this.buildFacturasTable(data)],
        },

        {
          name: '07 Pagos',

          title: 'Pagos registrados en el período',

          tables: [this.buildPagosTable(data)],
        },
      ],
    };
  }

  // 01 - INFORMACIÓN

  private static buildReporteInfoTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Información del reporte',

      headers: ['Concepto', 'Valor'],

      widths: [35, 45],

      rows: [
        ['Generado', this.formatDateTime(data.metadata.generadoEn)],

        [
          'Período de factura desde',
          this.formatPeriodo(data.metadata.periodoDesde),
        ],

        [
          'Período de factura hasta',
          this.formatPeriodo(data.metadata.periodoHasta),
        ],

        [
          'Pagos registrados desde',
          this.formatDate(data.metadata.fechaPagoDesdeInclusivo),
        ],

        [
          'Pagos registrados hasta',
          this.formatInclusiveEndDate(data.metadata.fechaPagoHastaExclusivo),
        ],
        ['Meses futuros adicionales', data.metadata.mesesProyeccion],

        [
          'Remanente del mes actual',
          data.metadata.mesesProyeccion > 0 ? 'Incluido' : 'No incluido',
        ],

        ['Base de proyección', 'Cartera facturable actual'],
      ],
    };
  }

  // 01 - FILTROS

  private static buildFiltrosTable(data: FacturacionReporteData): XlsxTable {
    const filters = data.metadata.filtros;

    return {
      title: 'Filtros aplicados',

      headers: ['Filtro', 'Valor'],

      widths: [32, 60],

      rows: [
        [
          'Estados de factura',
          this.formatFilterValues(filters.facturacion.estadosFactura),
        ],

        ['Zonas IDs', this.formatIds(filters.facturacion.zonaIds)],

        ['Creadores IDs', this.formatIds(filters.facturacion.creadorIds)],

        ['Cliente ID', filters.facturacion.clienteId ?? 'Todos'],

        [
          'Métodos de pago',
          this.formatFilterValues(filters.cobranza.metodosPago),
        ],

        [
          'Orígenes de pago',
          this.formatFilterValues(filters.cobranza.origenesPago),
        ],

        ['Cobradores IDs', this.formatIds(filters.cobranza.cobradorIds)],

        ['Rutas IDs', this.formatIds(filters.cobranza.rutaIds)],
      ],
    };
  }

  // 01 - FACTURAS

  private static buildResumenFacturasTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    const value = data.dashboard.facturacion;

    return {
      title: 'Facturas del período',

      headers: ['Emitidas', 'Anuladas', 'Con saldo', 'Vencidas con saldo'],

      widths: [16, 16, 18, 24],

      columnFormats: ['integer', 'integer', 'integer', 'integer'],

      rows: [
        [
          value.facturasEmitidas,
          value.facturasAnuladas,
          value.facturasConSaldoPendiente,
          value.facturasVencidasConSaldo,
        ],
      ],
    };
  }

  private static buildResumenMontosFacturasTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    const value = data.dashboard.facturacion;

    return {
      title: 'Montos de facturación',

      headers: [
        'Facturado',
        'Cubierto actualmente',
        'Saldo pendiente',
        'Cobertura actual',
      ],

      widths: [22, 24, 22, 20],

      columnFormats: [
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: [
        [
          value.totalFacturado,
          value.montoCubiertoActual,
          value.saldoPendienteActual,
          this.toExcelPercentage(value.porcentajeCubiertoActual),
        ],
      ],
    };
  }

  // 01 - COBROS

  private static buildResumenCobrosTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    const value = data.dashboard.cobros;

    return {
      title: 'Cobros registrados',

      headers: ['Pagos', 'Clientes', 'Total recaudado', 'Pago promedio'],

      widths: [14, 16, 22, 20],

      columnFormats: ['integer', 'integer', 'currency_gtq', 'currency_gtq'],

      rows: [
        [
          value.pagosRegistrados,
          value.clientesQuePagaron,
          value.totalRecaudado,
          value.pagoPromedio,
        ],
      ],
    };
  }

  // 01 - CARTERA

  private static buildResumenCarteraTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    const value = data.dashboard.cartera;

    return {
      title: 'Cartera actual global al corte',

      headers: [
        'Facturas pendientes',
        'Clientes con deuda',
        'Cuentas por cobrar',
        'Saldo vencido',
        'Saldo por vencer',
        'Saldo sin fecha',
      ],

      widths: [22, 20, 22, 20, 20, 20],

      columnFormats: [
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
      ],

      rows: [
        [
          value.facturasPendientes,
          value.clientesConDeuda,
          value.cuentasPorCobrar,
          value.saldoVencido,
          value.saldoPorVencer,
          value.saldoSinFechaVencimiento,
        ],
      ],
    };
  }

  // 01 - PROYECCIÓN

  private static buildResumenProyeccionTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Facturación pendiente de generar',

      headers: ['Período', 'Clientes proyectados', 'Monto proyectado'],

      widths: [22, 22, 22],

      columnFormats: [null, 'integer', 'currency_gtq'],

      rows: data.dashboard.proyeccionMensual.map((item) => [
        this.formatPeriodo(item.periodo),

        item.clientesProyectados,

        item.montoProyectado,
      ]),
    };
  }

  // 01 - TOP PAGADORES

  private static buildTopPagadoresTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Clientes con mayor monto pagado',

      headers: [
        'Cliente ID',
        'Cliente',
        'Pagos',
        'Facturas con pago',
        'Total pagado',
      ],

      widths: [14, 35, 12, 20, 20],

      columnFormats: ['integer', null, 'integer', 'integer', 'currency_gtq'],

      rows: data.dashboard.topPagadores.map((item) => [
        item.clienteId,

        item.cliente,

        item.pagosRegistrados,

        item.facturasConPago,

        item.totalPagado,
      ]),
    };
  }

  // 01 - TOP DEUDORES

  private static buildTopDeudoresTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Clientes con mayor saldo pendiente',

      headers: [
        'Cliente ID',
        'Cliente',
        'Facturas pendientes',
        'Vencimiento más antiguo',
        'Días mora',
        'Total pendiente',
      ],

      widths: [14, 35, 20, 24, 14, 22],

      columnFormats: [
        'integer',
        null,
        'integer',
        'date',
        'integer',
        'currency_gtq',
      ],

      rows: data.dashboard.topDeudores.map((item) => [
        item.clienteId,

        item.cliente,

        item.facturasPendientes,

        item.fechaPagoEsperadaMasAntigua,

        item.diasMoraMaximos,

        item.totalPendiente,
      ]),
    };
  }

  // 02 - FACTURACIÓN MENSUAL

  private static buildEvolucionFacturacionTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Facturación mensual',

      headers: [
        'Período',
        'Facturas emitidas',
        'Anuladas',
        'Facturado',
        'Cubierto actual',
        'Pendiente actual',
        'Cobertura actual',
      ],

      widths: [20, 18, 14, 20, 20, 20, 18],

      columnFormats: [
        null,
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: data.evolucion.facturacionMensual.map((item) => [
        this.formatPeriodo(item.periodo),

        item.facturasEmitidas,

        item.facturasAnuladas,

        item.facturado,

        item.cubiertoActual,

        item.saldoPendienteActual,

        this.toExcelPercentage(item.porcentajeCubiertoActual),
      ]),
    };
  }

  // 02 - RECAUDACIÓN MENSUAL

  private static buildEvolucionRecaudacionTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Recaudación por mes de pago',

      headers: [
        'Mes de pago',
        'Pagos',
        'Clientes',
        'Recaudado',
        'Pago promedio',
      ],

      widths: [20, 14, 16, 20, 20],

      columnFormats: [
        null,
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
      ],

      rows: data.evolucion.recaudacionMensual.map((item) => [
        this.formatPeriodo(item.periodo),

        item.pagosRegistrados,

        item.clientesQuePagaron,

        item.recaudado,

        item.pagoPromedio,
      ]),
    };
  }

  // 02 - RECUPERACIÓN DE COHORTES

  private static buildRecuperacionCohortesTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Recuperación por período facturado',

      headers: [
        'Período',
        'Facturas',
        'Facturado',
        'Cubierto actual',
        'Pendiente actual',
        '% actual',

        'Elegibles venc.',
        'Monto elegible venc.',
        'Recuperado venc.',
        '% venc.',

        'Elegibles +30',
        'Monto elegible +30',
        'Recuperado +30',
        '% +30',

        'Elegibles +60',
        'Monto elegible +60',
        'Recuperado +60',
        '% +60',
      ],

      widths: [
        18, 12, 18, 18, 18, 14, 16, 20, 20, 14, 16, 20, 20, 14, 16, 20, 20, 14,
      ],

      columnFormats: [
        null,
        'integer',

        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'percentage',

        'integer',
        'currency_gtq',
        'currency_gtq',
        'percentage',

        'integer',
        'currency_gtq',
        'currency_gtq',
        'percentage',

        'integer',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: data.evolucion.recuperacionCohortes.map((item) => [
        this.formatPeriodo(item.periodo),

        item.facturas,

        item.montoFacturado,

        item.cubiertoActual,

        item.saldoPendienteActual,

        this.toExcelPercentage(item.porcentajeRecuperadoActual),

        item.facturasElegiblesAlVencimiento,

        item.montoElegibleAlVencimiento,

        item.recuperadoAlVencimiento,

        this.toExcelPercentage(item.porcentajeRecuperadoAlVencimiento),

        item.facturasElegibles30Dias,

        item.montoElegible30Dias,

        item.recuperado30Dias,

        this.toExcelPercentage(item.porcentajeRecuperado30Dias),

        item.facturasElegibles60Dias,

        item.montoElegible60Dias,

        item.recuperado60Dias,

        this.toExcelPercentage(item.porcentajeRecuperado60Dias),
      ]),
    };
  }

  // 03 - AGING

  private static buildAgingTable(data: FacturacionReporteData): XlsxTable {
    return {
      title: 'Antigüedad de saldos',

      headers: [
        'Rango',
        'Facturas',
        'Clientes',
        'Saldo pendiente',
        '% cartera',
      ],

      widths: [28, 14, 14, 22, 16],

      columnFormats: [null, 'integer', 'integer', 'currency_gtq', 'percentage'],

      rows: data.cartera.aging.map((item) => [
        item.etiqueta,

        item.facturas,

        item.clientes,

        item.saldoPendiente,

        this.toExcelPercentage(item.porcentajeCartera),
      ]),
    };
  }

  // 03 - CARTERA POR ZONA

  private static buildCarteraZonaTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Cartera por zona',

      headers: [
        'Zona',
        'Facturas pendientes',
        'Clientes con deuda',
        'Saldo pendiente',
        'Vencido',
        'Por vencer',
        'Sin fecha',
        '% cartera',
      ],

      widths: [30, 20, 20, 22, 20, 20, 20, 16],

      columnFormats: [
        null,
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: data.cartera.porZona.map((item) => [
        item.zona,

        item.facturasPendientes,

        item.clientesConDeuda,

        item.saldoPendiente,

        item.saldoVencido,

        item.saldoPorVencer,

        item.saldoSinFechaVencimiento,

        this.toExcelPercentage(item.porcentajeCartera),
      ]),
    };
  }

  // 03 - DEUDORES

  private static buildCarteraClientesTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Clientes con saldo pendiente',

      headers: [
        'Cliente ID',
        'Cliente',
        'Zona',
        'Facturas pendientes',
        'Facturas vencidas',
        'Vencimiento más antiguo',
        'Días mora',
        'Saldo vencido',
        'Por vencer',
        'Sin fecha',
        'Total pendiente',
      ],

      widths: [14, 35, 35, 20, 18, 24, 14, 20, 20, 20, 22],

      columnFormats: [
        'integer',
        null,
        null,
        'integer',
        'integer',
        'date',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
      ],

      rows: data.cartera.clientes.map((item) => [
        item.clienteId,

        item.cliente,

        item.zonas.join(', '),

        item.facturasPendientes,

        item.facturasVencidas,

        item.fechaPagoEsperadaMasAntigua,

        item.diasMoraMaximos,

        item.saldoVencido,

        item.saldoPorVencer,

        item.saldoSinFechaVencimiento,

        item.totalPendiente,
      ]),
    };
  }

  // 04 - FACTURACIÓN POR ZONA

  private static buildZonaFacturacionTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Facturación por zona',

      headers: [
        'Zona',
        'Facturas emitidas',
        'Anuladas',
        'Clientes facturados',
        'Facturado',
        'Cubierto actual',
        'Pendiente actual',
        'Cobertura',
      ],

      widths: [30, 18, 14, 20, 20, 20, 20, 16],

      columnFormats: [
        null,
        'integer',
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: data.zonas.facturacion.map((item) => [
        item.zona,

        item.facturasEmitidas,

        item.facturasAnuladas,

        item.clientesFacturados,

        item.facturado,

        item.montoCubiertoActual,

        item.saldoPendienteActual,

        this.toExcelPercentage(item.porcentajeCubiertoActual),
      ]),
    };
  }

  // 04 - RECAUDACIÓN POR ZONA

  private static buildZonaRecaudacionTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Recaudación registrada por zona de factura',

      headers: ['Zona', 'Pagos', 'Clientes', 'Recaudado', 'Pago promedio'],

      widths: [30, 14, 16, 20, 20],

      columnFormats: [
        null,
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
      ],

      rows: data.zonas.recaudacion.map((item) => [
        item.zona,

        item.pagosRegistrados,

        item.clientesQuePagaron,

        item.recaudado,

        item.pagoPromedio,
      ]),
    };
  }

  // 04 - PROYECCIÓN POR ZONA

  private static buildZonaProyeccionTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    return {
      title: 'Próximas generaciones de facturación',

      headers: [
        'Zona',

        'Período factura',

        'Día generación',

        'Día pago',

        'Generación programada',

        'Pago programado',

        'Clientes facturables actuales',

        'Potencial mensual actual',

        'Facturas ya existentes',

        'Anuladas existentes',

        'Monto ya emitido vigente',

        'Clientes pendientes de generar',

        'Monto pendiente de generar',
      ],

      widths: [30, 20, 18, 14, 24, 20, 26, 24, 22, 20, 24, 26, 26],

      columnFormats: [
        null,
        null,
        'integer',
        'integer',
        'datetime',
        'date',
        'integer',
        'currency_gtq',
        'integer',
        'integer',
        'currency_gtq',
        'integer',
        'currency_gtq',
      ],

      rows: data.zonas.proyeccion.map((item) => [
        item.zona,

        this.formatPeriodo(item.periodo),

        item.diaGeneracionFactura,

        item.diaPago,

        item.fechaGeneracionProgramada,

        item.fechaPagoProgramada,

        item.clientesFacturablesActuales,

        item.potencialMensualActual,

        item.facturasYaExistentes,

        item.facturasAnuladasExistentes,

        item.montoYaEmitidoVigente,

        item.clientesProyectados,

        item.montoProyectado,
      ]),
    };
  }

  // 05 - COBRADORES

  private static buildCobradoresTable(data: FacturacionReporteData): XlsxTable {
    return {
      title: 'Cobranza por cobrador',

      headers: [
        'Cobrador',
        'Pagos',
        'Clientes',
        'Facturas',
        'Recaudado',
        'Pago promedio',
        '% recaudación',
      ],

      widths: [32, 14, 16, 16, 20, 20, 18],

      columnFormats: [
        null,
        'integer',
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: data.cobranzaOperativa.cobradores.map((item) => [
        item.cobrador,

        item.pagosRegistrados,

        item.clientesCobrados,

        item.facturasConPago,

        item.totalRecaudado,

        item.pagoPromedio,

        this.toExcelPercentage(item.porcentajeRecaudacion),
      ]),
    };
  }

  // 05 - RUTAS

  private static buildRutasTable(data: FacturacionReporteData): XlsxTable {
    return {
      title: 'Recaudación vinculada a rutas',

      headers: [
        'Ruta',
        'Pagos',
        'Clientes',
        'Facturas',
        'Recaudado',
        'Pago promedio',
        '% de cobros por ruta',
      ],

      widths: [32, 14, 16, 16, 20, 20, 22],

      columnFormats: [
        null,
        'integer',
        'integer',
        'integer',
        'currency_gtq',
        'currency_gtq',
        'percentage',
      ],

      rows: data.cobranzaOperativa.rutas.map((item) => [
        item.ruta,

        item.pagosRegistrados,

        item.clientesCobrados,

        item.facturasConPago,

        item.totalRecaudado,

        item.pagoPromedio,

        this.toExcelPercentage(item.porcentajeRecaudacionRutas),
      ]),
    };
  }

  // 05 - ORIGEN

  private static buildOrigenesTable(data: FacturacionReporteData): XlsxTable {
    return {
      title: 'Recaudación por origen',

      headers: ['Origen', 'Pagos', 'Clientes', 'Recaudado', '% recaudación'],

      widths: [28, 14, 16, 20, 18],

      columnFormats: [null, 'integer', 'integer', 'currency_gtq', 'percentage'],

      rows: data.cobranzaOperativa.origenesPago.map((item) => [
        this.formatLabel(item.origen),

        item.pagosRegistrados,

        item.clientesQuePagaron,

        item.totalRecaudado,

        this.toExcelPercentage(item.porcentajeRecaudacion),
      ]),
    };
  }

  // 05 - MÉTODO

  private static buildMetodosTable(data: FacturacionReporteData): XlsxTable {
    return {
      title: 'Recaudación por método de pago',

      headers: ['Método', 'Pagos', 'Clientes', 'Recaudado', '% recaudación'],

      widths: [28, 14, 16, 20, 18],

      columnFormats: [null, 'integer', 'integer', 'currency_gtq', 'percentage'],

      rows: data.cobranzaOperativa.metodosPago.map((item) => [
        this.formatLabel(item.metodoPago),

        item.pagosRegistrados,

        item.clientesQuePagaron,

        item.totalRecaudado,

        this.toExcelPercentage(item.porcentajeRecaudacion),
      ]),
    };
  }

  // 05 - CONTROL

  private static buildCobranzaControlTable(
    data: FacturacionReporteData,
  ): XlsxTable {
    const value = data.cobranzaOperativa.control;

    return {
      title: 'Control de trazabilidad',

      headers: ['Control', 'Casos', 'Monto'],

      widths: [55, 14, 22],

      columnFormats: [null, 'integer', 'currency_gtq'],

      rows: [
        [
          'Pagos sin cobrador registrado',

          value.pagosSinCobradorRegistrado,

          value.montoSinCobradorRegistrado,
        ],

        [
          'Pagos con origen RUTA sin ruta vinculada',

          value.pagosOrigenRutaSinRutaVinculada,

          value.montoOrigenRutaSinRutaVinculada,
        ],
      ],
    };
  }

  // 06 - FACTURAS

  private static buildFacturasTable(data: FacturacionReporteData): XlsxTable {
    const pagosPorFactura = this.buildPagosPorFactura(data.pagosCohorte);

    return {
      headers: [
        'Factura ID',
        'Período',
        'Cliente ID',
        'Cliente',
        'Zona',
        'Creada por',
        'Fecha esperada de pago',
        'Estado',
        'Monto factura',
        'Cubierto actual',
        'Saldo pendiente',
        'Pagos registrados',
        'Último pago',
        'Días mora',
        'Creada',
      ],

      widths: [14, 18, 14, 38, 30, 28, 24, 20, 20, 20, 20, 18, 20, 14, 22],

      columnFormats: [
        'integer',
        null,
        'integer',
        null,
        null,
        null,
        'date',
        null,
        'currency_gtq',
        'currency_gtq',
        'currency_gtq',
        'integer',
        'datetime',
        'integer',
        'datetime',
      ],

      rows: data.facturas.map((factura) => {
        const pagos = pagosPorFactura.get(factura.facturaId);

        return [
          factura.facturaId,

          this.formatPeriodo(factura.periodo),

          factura.clienteId,

          this.resolveClienteFactura(factura),

          factura.facturacionZonaNombre ?? this.EMPTY,

          factura.creadorNombre ?? this.EMPTY,

          factura.fechaPagoEsperada,

          this.formatLabel(factura.estado),

          factura.montoFactura,

          Math.max(factura.montoFactura - factura.saldoPendiente, 0),

          factura.saldoPendiente,

          pagos?.cantidad ?? 0,

          pagos?.ultimoPago ?? null,

          this.calculateDiasMora(factura, data.metadata.fechaCorte),

          factura.creadoEn,
        ];
      }),
    };
  }

  // 07 - PAGOS

  private static buildPagosTable(data: FacturacionReporteData): XlsxTable {
    return {
      headers: [
        'Pago ID',
        'Fecha',
        'Factura ID',
        'Período factura',
        'Cliente ID',
        'Cliente',
        'Monto',
        'Método',
        'Origen',
        'Cobrador',
        'Ruta',
        'Número boleta',
        'Código confirmación',
      ],

      widths: [14, 22, 14, 18, 14, 38, 20, 20, 20, 30, 30, 24, 26],

      columnFormats: [
        'integer',
        'datetime',
        'integer',
        null,
        'integer',
        null,
        'currency_gtq',
        null,
        null,
        null,
        null,
        null,
        null,
      ],

      rows: data.pagos.map((pago) => [
        pago.pagoId,

        pago.fechaPago,

        pago.facturaInternetId,

        this.formatPeriodo(pago.facturaPeriodo),

        pago.clienteId,

        pago.clienteNombre,

        pago.montoPagado,

        this.formatLabel(pago.metodoPago),

        this.formatLabel(pago.origen),

        pago.cobradorNombre ?? this.EMPTY,

        pago.rutaNombre ?? this.EMPTY,

        pago.numeroBoleta ?? this.EMPTY,

        pago.codigoConfirmacion ?? this.EMPTY,
      ]),
    };
  }

  // PAGOS POR FACTURA

  private static buildPagosPorFactura(
    pagos: PagoReporteRow[],
  ): Map<number, FacturaPagoResumen> {
    const map = new Map<number, FacturaPagoResumen>();

    for (const pago of pagos) {
      const existing = map.get(pago.facturaInternetId);

      if (!existing) {
        map.set(pago.facturaInternetId, {
          cantidad: 1,

          ultimoPago: pago.fechaPago,
        });

        continue;
      }

      existing.cantidad += 1;

      if (
        !existing.ultimoPago ||
        pago.fechaPago.getTime() > existing.ultimoPago.getTime()
      ) {
        existing.ultimoPago = pago.fechaPago;
      }
    }

    return map;
  }

  // FACTURA HELPERS

  private static resolveClienteFactura(factura: FacturaReporteRow): string {
    const snapshot = factura.nombreClienteFactura?.trim();

    if (snapshot) {
      return snapshot;
    }

    return factura.clienteNombreActual || this.EMPTY;
  }

  private static calculateDiasMora(
    factura: FacturaReporteRow,
    fechaCorte: Date,
  ): number | null {
    if (factura.saldoPendiente <= 0 || !factura.fechaPagoEsperada) {
      return null;
    }

    const esperada = dayjs(factura.fechaPagoEsperada).tz(TZ).startOf('day');

    const corte = dayjs(fechaCorte).tz(TZ).startOf('day');

    return Math.max(corte.diff(esperada, 'day'), 0);
  }

  // FORMATO

  private static toExcelPercentage(value: number): number {
    return value / 100;
  }

  private static formatPeriodo(periodo: string): string {
    if (!/^\d{6}$/.test(periodo)) {
      return periodo;
    }

    const year = periodo.slice(0, 4);

    const month = periodo.slice(4, 6);

    const value = dayjs.tz(`${year}-${month}-01`, TZ);

    const text = value.format('MMMM YYYY');

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private static formatDate(value: Date): string {
    return dayjs(value).tz(TZ).format('DD/MM/YYYY');
  }

  private static formatDateTime(value: Date): string {
    return dayjs(value).tz(TZ).format('DD/MM/YYYY HH:mm');
  }

  private static formatInclusiveEndDate(hastaExclusivo: Date): string {
    return dayjs(hastaExclusivo).tz(TZ).subtract(1, 'day').format('DD/MM/YYYY');
  }

  private static formatIds(values: number[]): string {
    if (values.length === 0) {
      return 'Todos';
    }

    return values.join(', ');
  }

  private static formatFilterValues(values: string[]): string {
    if (values.length === 0) {
      return 'Todos';
    }

    return values.map((value) => this.formatLabel(value)).join(', ');
  }

  private static formatLabel(value: string): string {
    const known: Record<string, string> = {
      EN_LINEA: 'En línea',

      DEPOSITO: 'Depósito',

      EFECTIVO: 'Efectivo',

      TARJETA: 'Tarjeta',

      PAYPAL: 'PayPal',

      PENDIENTE: 'Pendiente',

      PAGADA: 'Pagada',

      VENCIDA: 'Vencida',

      ANULADA: 'Anulada',

      PARCIAL: 'Parcial',

      RUTA: 'Ruta',

      OFICINA: 'Oficina',

      TRANSFERENCIA: 'Transferencia',

      OTRO: 'Otro',
    };

    if (known[value]) {
      return known[value];
    }

    const text = value.replace(/_/g, ' ').toLowerCase();

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // FILENAME

  private static buildFilename(data: FacturacionReporteData): string {
    const timestamp = dayjs(data.metadata.generadoEn)
      .tz(TZ)
      .format('YYYYMMDD-HHmmss');

    return (
      [
        'reporte-facturacion',
        data.metadata.periodoDesde,
        data.metadata.periodoHasta,
        timestamp,
      ].join('-') + '.xlsx'
    );
  }
}
