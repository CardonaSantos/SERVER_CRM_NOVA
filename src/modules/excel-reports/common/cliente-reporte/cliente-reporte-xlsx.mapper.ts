import {
  XlsxCellValue,
  XlsxDocument,
  XlsxTable,
} from '../../domain/ports/xlsx-writer.port';

import { ClienteReporteData } from '../../domain/read-models/cliente-reportes/cliente-reporte-data';

export class ClienteReporteXlsxMapper {
  static toDocument(data: ClienteReporteData): XlsxDocument {
    return {
      filename: this.buildFilename(),

      sheets: [
        {
          name: 'Resumen',
          title: 'Panorama general de clientes',

          tables: [
            this.buildReporteInfoTable(data),

            this.buildCarteraTable(data),

            this.buildMovimientoActualTable(data),

            this.buildEstadoClientesTable(data),

            this.buildCobranzaTable(data),

            this.buildOperacionesGlobalesTable(data),
          ],
        },

        {
          name: 'Actividad',
          title: 'Actividad operativa',

          tables: [
            this.buildResumenPeriodoTable(data.mesActual),

            this.buildInstalacionesPeriodoTable(data.mesActual),

            this.buildDesinstalacionesPeriodoTable(data.mesActual),

            this.buildResumenPeriodoTable(data.anioActual),

            this.buildInstalacionesPeriodoTable(data.anioActual),

            this.buildDesinstalacionesPeriodoTable(data.anioActual),
          ],
        },

        {
          name: 'Evolución',
          title: 'Evolución de clientes - últimos 12 meses',

          tables: [this.buildEvolucionTable(data)],
        },

        {
          name: 'Distribución',
          title: 'Distribución de la cartera',

          tables: [
            this.buildPlanesTable(data),

            this.buildDepartamentosTable(data),

            this.buildMunicipiosTable(data),

            this.buildSectoresTable(data),

            this.buildCalidadDatosTable(data),
          ],
        },

        {
          name: 'Clientes',
          title: 'Detalle de clientes',

          tables: [this.buildClientesTable(data)],
        },
      ],
    };
  }

  // =========================================================
  // RESUMEN
  // =========================================================

  private static buildReporteInfoTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Información del reporte',

      headers: ['Concepto', 'Valor'],

      widths: [30, 30],

      rows: [
        ['Tipo de resumen', 'Estado global actual'],

        ['Generado', data.generadoEn],

        ['Período mensual', data.mesActual.etiqueta],

        ['Período anual', data.anioActual.etiqueta],
      ],
    };
  }

  private static buildCarteraTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Cartera actual',

      headers: ['Indicador', 'Total'],

      widths: [35, 15],

      rows: [
        ['Clientes registrados', data.resumen.totalClientes],

        ['Cartera operativa actual', data.resumen.carteraActual],
      ],
    };
  }

  private static buildMovimientoActualTable(
    data: ClienteReporteData,
  ): XlsxTable {
    return {
      title: 'Movimiento reciente',

      headers: ['Período', 'Altas', 'Bajas', 'Crecimiento neto'],

      widths: [25, 15, 15, 20],

      rows: [
        [
          data.mesActual.etiqueta,
          data.mesActual.altas,
          data.mesActual.bajas,
          data.mesActual.crecimientoNeto,
        ],

        [
          data.anioActual.etiqueta,
          data.anioActual.altas,
          data.anioActual.bajas,
          data.anioActual.crecimientoNeto,
        ],
      ],
    };
  }

  private static buildEstadoClientesTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Estado actual de clientes',

      headers: ['Estado', 'Clientes', '% del total'],

      widths: [30, 15, 18],

      rows: data.resumen.porEstadoCliente.map((item) => [
        this.formatLabel(item.categoria),

        item.total,

        this.formatPercentage(item.total, data.resumen.totalClientes),
      ]),
    };
  }

  private static buildCobranzaTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Estado actual de cobranza',

      headers: ['Estado', 'Clientes', '% del total'],

      widths: [30, 15, 18],

      rows: data.resumen.porEstadoCobranza.map((item) => [
        this.formatLabel(item.categoria),

        item.total,

        this.formatPercentage(item.total, data.resumen.totalClientes),
      ]),
    };
  }

  private static buildOperacionesGlobalesTable(
    data: ClienteReporteData,
  ): XlsxTable {
    return {
      title: 'Histórico operativo registrado',

      headers: ['Operación', 'Total registrado'],

      widths: [35, 20],

      rows: [
        ['Instalaciones', data.resumen.instalaciones.total],

        ['Desinstalaciones', data.resumen.desinstalaciones.total],
      ],
    };
  }

  // =========================================================
  // ACTIVIDAD
  // =========================================================

  private static buildResumenPeriodoTable(
    periodo: ClienteReporteData['mesActual'],
  ): XlsxTable {
    return {
      title: `Resumen - ${periodo.etiqueta}`,

      headers: ['Indicador', 'Total'],

      widths: [35, 18],

      rows: [
        ['Altas de servicio', periodo.altas],

        ['Bajas de servicio', periodo.bajas],

        ['Crecimiento neto', periodo.crecimientoNeto],

        [
          'Órdenes de instalación registradas',
          periodo.instalaciones.registradas,
        ],

        [
          'Órdenes de desinstalación registradas',
          periodo.desinstalaciones.registradas,
        ],
      ],
    };
  }

  private static buildInstalacionesPeriodoTable(
    periodo: ClienteReporteData['mesActual'],
  ): XlsxTable {
    return {
      title: `Instalaciones registradas - ${periodo.etiqueta}`,

      headers: ['Estado actual', 'Cantidad'],

      widths: [30, 15],

      rows: periodo.instalaciones.porEstadoActual.map((item) => [
        this.formatLabel(item.categoria),

        item.total,
      ]),
    };
  }

  private static buildDesinstalacionesPeriodoTable(
    periodo: ClienteReporteData['mesActual'],
  ): XlsxTable {
    return {
      title: `Desinstalaciones registradas - ${periodo.etiqueta}`,

      headers: ['Estado actual', 'Cantidad'],

      widths: [30, 15],

      rows: periodo.desinstalaciones.porEstadoActual.map((item) => [
        this.formatLabel(item.categoria),

        item.total,
      ]),
    };
  }

  // =========================================================
  // EVOLUCIÓN
  // =========================================================

  private static buildEvolucionTable(data: ClienteReporteData): XlsxTable {
    let acumulado = 0;

    return {
      title: 'Altas y bajas mensuales',

      headers: ['Mes', 'Altas', 'Bajas', 'Neto', 'Neto acumulado'],

      widths: [25, 15, 15, 15, 20],

      rows: data.evolucionMensual.map((item) => {
        acumulado += item.crecimientoNeto;

        return [
          item.etiqueta,

          item.altas,

          item.bajas,

          item.crecimientoNeto,

          acumulado,
        ];
      }),
    };
  }

  // =========================================================
  // DISTRIBUCIÓN
  // =========================================================

  private static buildPlanesTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Clientes por plan',

      headers: ['Plan', 'Clientes', '%'],

      widths: [40, 15, 15],

      rows: data.distribuciones.porPlan.map((item) => [
        item.categoria,

        item.total,

        this.formatPercentage(
          item.total,
          data.distribuciones.calidadDatos.total,
        ),
      ]),
    };
  }

  private static buildDepartamentosTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Clientes por departamento',

      headers: ['Departamento', 'Clientes', '%'],

      widths: [35, 15, 15],

      rows: data.distribuciones.porDepartamento.map((item) => [
        item.categoria,

        item.total,

        this.formatPercentage(
          item.total,
          data.distribuciones.calidadDatos.total,
        ),
      ]),
    };
  }

  private static buildMunicipiosTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Clientes por municipio',

      headers: ['Municipio', 'Clientes', '%'],

      widths: [35, 15, 15],

      rows: data.distribuciones.porMunicipio.map((item) => [
        item.categoria,

        item.total,

        this.formatPercentage(
          item.total,
          data.distribuciones.calidadDatos.total,
        ),
      ]),
    };
  }

  private static buildSectoresTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Clientes por sector',

      headers: ['Sector', 'Clientes', '%'],

      widths: [35, 15, 15],

      rows: data.distribuciones.porSector.map((item) => [
        item.categoria,

        item.total,

        this.formatPercentage(
          item.total,
          data.distribuciones.calidadDatos.total,
        ),
      ]),
    };
  }

  private static buildCalidadDatosTable(data: ClienteReporteData): XlsxTable {
    const calidad = data.distribuciones.calidadDatos;

    return {
      title: 'Calidad y completitud de datos',

      headers: ['Dato', 'Con información', 'Sin información', 'Cobertura'],

      widths: [30, 20, 20, 18],

      rows: [
        [
          'Teléfono',
          calidad.conTelefono,
          calidad.sinTelefono,
          this.formatPercentage(calidad.conTelefono, calidad.total),
        ],

        [
          'DPI',
          calidad.conDpi,
          calidad.sinDpi,
          this.formatPercentage(calidad.conDpi, calidad.total),
        ],

        [
          'Plan',
          calidad.conPlan,
          calidad.sinPlan,
          this.formatPercentage(calidad.conPlan, calidad.total),
        ],

        [
          'Ubicación',
          calidad.conUbicacion,
          calidad.sinUbicacion,
          this.formatPercentage(calidad.conUbicacion, calidad.total),
        ],

        [
          'Contacto de referencia',
          calidad.conContactoReferencia,
          calidad.sinContactoReferencia,
          this.formatPercentage(calidad.conContactoReferencia, calidad.total),
        ],
      ],
    };
  }

  // =========================================================
  // CLIENTES
  // =========================================================

  private static buildClientesTable(data: ClienteReporteData): XlsxTable {
    return {
      headers: [
        'ID',
        'Cliente',
        'DPI',

        'Teléfono',
        'Contacto referencia',
        'Teléfono referencia',

        'Estado',
        'Cobranza',

        'Plan',

        'Sector',
        'Municipio',
        'Departamento',
        'Dirección',
        'Ubicación Maps',

        'Fecha instalación',

        'Tickets',
        'Instalaciones',
        'Desinstalaciones',

        'Observaciones',
        'Nota',

        'Creado',
        'Actualizado',
      ],

      widths: [
        10, 35, 20,

        18, 30, 18,

        22, 22,

        30,

        25, 25, 25, 45, 20,

        20,

        12, 16, 18,

        40, 40,

        22, 22,
      ],

      rows: data.clientes.map((cliente) => [
        cliente.id,

        cliente.nombreCompleto,

        cliente.dpi,

        cliente.telefono,

        cliente.contactoReferenciaNombre,

        cliente.contactoReferenciaTelefono,

        this.formatLabel(cliente.estadoCliente),

        this.formatLabel(cliente.estadoCobranza),

        cliente.plan,

        cliente.sector,

        cliente.municipio,

        cliente.departamento,

        cliente.direccion,

        `${cliente.latitud ?? ''},${cliente.longitud ?? ''}`,

        cliente.fechaInstalacion,

        cliente.totalTickets,

        cliente.totalInstalaciones,

        cliente.totalDesinstalaciones,

        cliente.observaciones,

        cliente.nota,

        cliente.creadoEn,

        cliente.actualizadoEn,
      ]),
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private static formatPercentage(value: number, total: number): string {
    if (total <= 0) {
      return '0.0%';
    }

    const percentage = (value / total) * 100;

    return `${percentage.toFixed(1)}%`;
  }

  private static formatLabel(value: string): string {
    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private static buildFilename(): string {
    const date = new Date().toISOString().slice(0, 10);

    return `reporte-clientes-${date}.xlsx`;
  }
}
