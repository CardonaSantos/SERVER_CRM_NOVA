import { XlsxDocument, XlsxTable } from '../domain/ports/xlsx-writer.port';
import { ClienteReporteData } from '../domain/read-models/cliente-reportes/cliente-reporte-data';

export class ClienteReporteXlsxMapper {
  static toDocument(data: ClienteReporteData): XlsxDocument {
    return {
      filename: this.buildFilename(),

      sheets: [
        {
          name: 'Resumen',
          title: 'Resumen de clientes',

          tables: [
            this.buildGeneralTable(data),

            this.buildEstadoClientesTable(data),

            this.buildCobranzaTable(data),

            this.buildInstalacionesTable(data),

            this.buildDesinstalacionesTable(data),
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

  private static buildGeneralTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Cartera',

      headers: ['Indicador', 'Total'],

      widths: [35, 15],

      rows: [
        ['Total de clientes', data.resumen.totalClientes],

        ['Cartera actual', data.resumen.carteraActual],
      ],
    };
  }

  private static buildEstadoClientesTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Clientes por estado',

      headers: ['Estado', 'Total'],

      widths: [30, 15],

      rows: data.resumen.porEstadoCliente.map((item) => [
        this.formatLabel(item.categoria),

        item.total,
      ]),
    };
  }

  private static buildCobranzaTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Estado de cobranza',

      headers: ['Estado', 'Total'],

      widths: [30, 15],

      rows: data.resumen.porEstadoCobranza.map((item) => [
        this.formatLabel(item.categoria),

        item.total,
      ]),
    };
  }

  private static buildInstalacionesTable(data: ClienteReporteData): XlsxTable {
    return {
      title: 'Instalaciones',

      headers: ['Estado', 'Total'],

      widths: [30, 15],

      rows: [
        ['TOTAL', data.resumen.instalaciones.total],

        ...data.resumen.instalaciones.porEstado.map((item) => [
          this.formatLabel(item.categoria),

          item.total,
        ]),
      ],
    };
  }

  private static buildDesinstalacionesTable(
    data: ClienteReporteData,
  ): XlsxTable {
    return {
      title: 'Desinstalaciones',

      headers: ['Estado', 'Total'],

      widths: [30, 15],

      rows: [
        ['TOTAL', data.resumen.desinstalaciones.total],

        ...data.resumen.desinstalaciones.porEstado.map((item) => [
          this.formatLabel(item.categoria),

          item.total,
        ]),
      ],
    };
  }

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

        'Asesor',

        'Plan',
        'Velocidad',
        'Precio',

        'Sector',
        'Municipio',
        'Departamento',
        'Dirección',

        'Fecha instalación',

        'Tickets',
        'Instalaciones',
        'Desinstalaciones',

        'Recordatorios',
        'WhatsApp',

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

        35, 18, 16,

        25, 25, 25, 45,

        20,

        14, 16, 18,

        16, 15,

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
