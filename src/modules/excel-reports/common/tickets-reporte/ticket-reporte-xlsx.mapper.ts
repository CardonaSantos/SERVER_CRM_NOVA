// import {
//   XlsxCellValue,
//   XlsxDocument,
//   XlsxTable,
// } from '../domain/ports/xlsx-writer.port';

import {
  XlsxCellValue,
  XlsxDocument,
  XlsxTable,
} from '../../domain/ports/xlsx-writer.port';
import { TicketReporteData } from '../../domain/read-models/tickets-reporte/ticket-reporte-data';
import { TicketReporteRow } from '../../domain/read-models/tickets-reporte/ticket-reporte-row';

// import { TicketReporteData } from '../domain/read-models/ticket-reportes/ticket-reporte-data';

// import { TicketReporteRow } from '../domain/read-models/ticket-reportes/ticket-reporte-row';

export class TicketReporteXlsxMapper {
  private static readonly TZ = 'America/Guatemala';

  private static readonly EMPTY = '—';
  // ==========================================================================
  // DOCUMENT
  // ==========================================================================

  static toDocument(data: TicketReporteData): XlsxDocument {
    return {
      filename: this.buildFilename(data),

      sheets: [
        {
          name: '01 Dashboard',

          title: 'Dashboard de tickets de soporte',

          tables: [
            this.buildReporteInfoTable(data),

            this.buildFiltrosTable(data),

            this.buildIndicadoresTable(data),

            this.buildTiemposTable(data),

            this.buildEstadosTable(data),

            this.buildPrioridadesTable(data),

            this.buildTopClientesTable(data),

            this.buildEtiquetasTable(data),
          ],
        },

        {
          name: '02 Periodo',

          title: 'Evolución de tickets por período',

          tables: [this.buildPeriodosTable(data)],
        },

        {
          name: '03 Tecnicos',

          title: 'Participación técnica en tickets',

          tables: [this.buildTecnicosTable(data)],
        },

        {
          name: '04 Detalle Tickets',

          title: 'Detalle de tickets de soporte',

          tables: [this.buildTicketsTable(data)],
        },
      ],
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - INFORMACIÓN DEL REPORTE
  // ==========================================================================

  private static buildReporteInfoTable(data: TicketReporteData): XlsxTable {
    return {
      title: 'Información del reporte',

      headers: ['Concepto', 'Valor'],

      widths: [35, 45],

      rows: [
        ['Generado', this.formatDate(data.metadata.generadoEn)],
        ['Período desde', this.formatDate(data.metadata.desdeInclusivo)],

        [
          'Período hasta',
          this.formatInclusiveEndDate(data.metadata.hastaExclusivo),
        ],

        ['Criterio temporal', 'Fecha de apertura del ticket'],

        [
          'Agrupación solicitada',
          this.formatLabel(data.metadata.agrupacionSolicitada),
        ],

        [
          'Agrupación aplicada',
          this.formatLabel(data.metadata.agrupacionEfectiva),
        ],
      ],
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - FILTROS
  // ==========================================================================

  private static buildFiltrosTable(data: TicketReporteData): XlsxTable {
    const filtros = data.metadata.filtros;

    return {
      title: 'Filtros aplicados',

      headers: ['Filtro', 'Valor'],

      widths: [30, 55],

      rows: [
        ['Estados', this.formatFilterValues(filtros.estados)],

        ['Prioridades', this.formatFilterValues(filtros.prioridades)],

        ['Etiquetas IDs', this.formatIdFilter(filtros.etiquetaIds)],

        ['Técnicos IDs', this.formatIdFilter(filtros.tecnicoIds)],

        ['Cliente ID', filtros.clienteId ?? 'Todos'],
      ],
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - INDICADORES
  // ==========================================================================

  private static buildIndicadoresTable(data: TicketReporteData): XlsxTable {
    const dashboard = data.dashboard;

    return {
      title: 'Indicadores generales',

      headers: ['Indicador', 'Total'],

      widths: [42, 18],

      rows: [
        ['Tickets abiertos en el período', dashboard.totalTickets],

        ['Finalizados actualmente', dashboard.totalFinalizados],

        ['Pendientes actualmente', dashboard.totalPendientes],

        ['Sin técnico participante', dashboard.totalSinTecnico],
      ],
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - TIEMPOS
  // ==========================================================================

  private static buildTiemposTable(data: TicketReporteData): XlsxTable {
    const tiempos = data.dashboard.tiempos;

    return {
      title: 'Tiempos promedio',

      headers: ['Indicador', 'Promedio', 'Tickets medidos'],

      widths: [55, 28, 20],

      rows: [
        [
          'Apertura → primera asignación',

          this.formatDuration(tiempos.promedioHastaAsignacionMinutos),

          tiempos.muestrasHastaAsignacion,
        ],

        [
          'Apertura → primera atención',

          this.formatDuration(tiempos.promedioHastaPrimeraAtencionMinutos),

          tiempos.muestrasHastaPrimeraAtencion,
        ],

        [
          'Apertura → resolución técnica',

          this.formatDuration(tiempos.promedioHastaResolucionTecnicaMinutos),

          tiempos.muestrasHastaResolucionTecnica,
        ],

        [
          'Tiempo técnico registrado del ticket',

          this.formatDuration(tiempos.promedioTiempoTecnicoRegistradoMinutos),

          tiempos.muestrasTiempoTecnicoRegistrado,
        ],

        [
          'Apertura → cierre',

          this.formatDuration(tiempos.promedioTiempoTotalMinutos),

          tiempos.muestrasTiempoTotal,
        ],
      ],
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - ESTADOS
  // ==========================================================================

  private static buildEstadosTable(data: TicketReporteData): XlsxTable {
    return {
      title: 'Distribución por estado actual',

      headers: ['Estado', 'Tickets', '% del total'],

      widths: [30, 15, 18],

      columnFormats: [null, 'integer', 'percentage'],

      rows: data.dashboard.porEstado.map((item) => [
        this.formatLabel(item.categoria),

        item.total,

        this.toExcelPercentage(item.total, data.dashboard.totalTickets),
      ]),
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - PRIORIDADES
  // ==========================================================================

  private static buildPrioridadesTable(data: TicketReporteData): XlsxTable {
    return {
      title: 'Distribución por prioridad actual',

      headers: ['Prioridad', 'Tickets', '% del total'],

      widths: [30, 15, 18],

      columnFormats: [null, 'integer', 'percentage'],

      rows: data.dashboard.porPrioridad.map((item) => [
        this.formatLabel(item.categoria),

        item.total,

        this.toExcelPercentage(item.total, data.dashboard.totalTickets),
      ]),
    };
  }

  // ==========================================================================
  // 01 DASHBOARD - ETIQUETAS
  // ==========================================================================

  private static buildEtiquetasTable(data: TicketReporteData): XlsxTable {
    return {
      title: 'Top etiquetas',

      headers: ['ID', 'Etiqueta', 'Tickets', '% de tickets'],

      widths: [10, 35, 15, 18],

      columnFormats: ['integer', null, 'integer', 'percentage'],

      rows: data.dashboard.topEtiquetas.map((item) => [
        item.etiquetaId,

        item.etiqueta,

        item.totalTickets,

        this.toExcelPercentage(item.totalTickets, data.dashboard.totalTickets),
      ]),
    };
  }

  //   CONSTRUCCION DE CLIENTES TOP TICKETS DEL PERIODO
  private static buildTopClientesTable(data: TicketReporteData): XlsxTable {
    return {
      title: 'Top 10 clientes con más tickets',

      headers: [
        'Posición',
        'Cliente ID',
        'Cliente',
        'Tickets',
        '% del período',
      ],

      widths: [12, 14, 40, 15, 18],

      columnFormats: ['integer', 'integer', null, 'integer', 'percentage'],

      rows: data.dashboard.topClientes.map((cliente, index) => [
        index + 1,

        cliente.clienteId,

        cliente.cliente,

        cliente.totalTickets,

        this.toExcelPercentage(
          cliente.totalTickets,
          data.dashboard.totalTickets,
        ),
      ]),
    };
  }

  // ==========================================================================
  // 02 PERÍODO
  // ==========================================================================

  private static buildPeriodosTable(data: TicketReporteData): XlsxTable {
    return {
      headers: [
        'Período',

        'Desde',
        'Hasta',

        'Tickets',
        'Finalizados',
        'Pendientes',
        'Urgentes',

        'Prom. asignación',
        'Prom. primera atención',
        'Prom. resolución técnica',
        'Prom. tiempo técnico registrado',
        'Prom. tiempo total',
      ],

      widths: [
        28,

        18, 18,

        14, 16, 16, 14,

        24, 28, 30, 34, 24,
      ],

      rows: data.periodos.map((periodo) => [
        periodo.etiqueta,

        this.formatDate(periodo.desde),

        this.formatInclusiveEndDate(periodo.hastaExclusivo),

        periodo.totalTickets,

        periodo.totalFinalizados,

        periodo.totalPendientes,

        periodo.totalUrgentes,

        this.formatDuration(periodo.promedioHastaAsignacionMinutos),

        this.formatDuration(periodo.promedioHastaPrimeraAtencionMinutos),

        this.formatDuration(periodo.promedioHastaResolucionTecnicaMinutos),

        this.formatDuration(periodo.promedioTiempoTecnicoRegistradoMinutos),

        this.formatDuration(periodo.promedioTiempoTotalMinutos),
      ]),
    };
  }

  // ==========================================================================
  // 03 TÉCNICOS
  // ==========================================================================

  private static buildTecnicosTable(data: TicketReporteData): XlsxTable {
    return {
      headers: [
        'Técnico ID',
        'Técnico',

        'Tickets con participación',
        'Como principal',
        'Como apoyo',

        'Tickets finalizados',
        'Tickets pendientes',
        'Tickets urgentes',

        'Tickets con resolución medible',
        'Prom. resolución técnica',

        'Prom. asignación de sus tickets',
        'Prom. primera atención de sus tickets',

        'Prom. tiempo técnico registrado de sus tickets',

        'Prom. tiempo total de sus tickets',
      ],

      widths: [
        14, 35,

        24, 18, 18,

        20, 20, 18,

        30, 28,

        34, 38,

        45,

        35,
      ],

      rows: data.tecnicos.map((tecnico) => [
        tecnico.tecnicoId,

        tecnico.tecnicoNombre,

        tecnico.totalParticipaciones,

        tecnico.comoPrincipal,

        tecnico.comoApoyo,

        tecnico.ticketsFinalizados,

        tecnico.ticketsPendientes,

        tecnico.ticketsUrgentes,

        tecnico.ticketsConResolucionTecnica,

        this.formatDuration(tecnico.promedioResolucionTecnicaTicketsMinutos),

        this.formatDuration(tecnico.promedioHastaAsignacionMinutos),

        this.formatDuration(tecnico.promedioHastaPrimeraAtencionMinutos),

        this.formatDuration(tecnico.promedioTiempoTecnicoTicketsMinutos),

        this.formatDuration(tecnico.promedioTiempoTotalTicketsMinutos),
      ]),
    };
  }

  // ==========================================================================
  // 04 DETALLE
  // ==========================================================================

  private static buildTicketsTable(data: TicketReporteData): XlsxTable {
    return {
      headers: [
        'Ticket ID',

        'Título',

        'Estado',
        'Prioridad',

        'Cliente ID',
        'Cliente',

        'Creado por ID',
        'Creado por',

        'Técnico principal ID',
        'Técnico principal',

        'Técnicos apoyo',
        'Todos los participantes',

        'Etiquetas',

        'Fecha apertura',
        'Fecha asignación',
        'Inicio atención',
        'Resolución técnica',
        'Fecha cierre',

        'Hasta asignación',
        'Hasta primera atención',
        'Hasta resolución técnica',

        'Tiempo técnico registrado',
        'Tiempo total',

        'Ciclos técnicos',

        'Solución ID',
        'Solución',

        'Resuelto como',

        'Notas internas',

        'Descripción',
      ],

      widths: [
        12,

        45,

        24, 18,

        14, 38,

        16, 30,

        22, 32,

        45, 55,

        50,

        22, 22, 22, 22, 22,

        24, 30, 32,

        32, 22,

        18,

        14, 35,

        55,

        55,

        65,
      ],

      rows: data.tickets.map((ticket) => this.buildTicketRow(ticket)),
    };
  }

  private static buildTicketRow(ticket: TicketReporteRow): XlsxCellValue[] {
    return [
      ticket.ticketId,

      this.valueOrEmpty(ticket.titulo),

      this.formatLabel(ticket.estado),

      this.formatLabel(ticket.prioridad),

      this.valueOrEmpty(ticket.clienteId),

      this.valueOrEmpty(ticket.clienteNombre),

      this.valueOrEmpty(ticket.creadoPorId),

      this.valueOrEmpty(ticket.creadoPorNombre),

      this.valueOrEmpty(ticket.tecnicoPrincipalId),

      this.valueOrEmpty(ticket.tecnicoPrincipalNombre),

      this.formatNames(ticket.tecnicosApoyo.map((tecnico) => tecnico.nombre)),

      this.formatNames(ticket.participantes.map((tecnico) => tecnico.nombre)),

      this.formatNames(ticket.etiquetas.map((etiqueta) => etiqueta.nombre)),

      this.formatDateTime(ticket.fechaApertura),

      this.formatDateTimeNullable(ticket.fechaAsignacion),

      this.formatDateTimeNullable(ticket.fechaInicioAtencion),

      this.formatDateTimeNullable(ticket.fechaResolucionTecnico),

      this.formatDateTimeNullable(ticket.fechaCierre),

      this.formatDuration(ticket.tiempoHastaAsignacionMinutos),

      this.formatDuration(ticket.tiempoHastaPrimeraAtencionMinutos),

      this.formatDuration(ticket.tiempoHastaResolucionTecnicaMinutos),

      this.formatDuration(ticket.tiempoTecnicoRegistradoMinutos),

      this.formatDuration(ticket.tiempoTotalMinutos),

      ticket.ciclosTecnicos,

      this.valueOrEmpty(ticket.solucionId),

      this.valueOrEmpty(ticket.solucionNombre),

      this.valueOrEmpty(ticket.resueltoComo),

      this.valueOrEmpty(ticket.notasInternas),

      this.valueOrEmpty(ticket.descripcion),
    ];
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static toExcelPercentage(value: number, total: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
      return 0;
    }

    /**
     * Excel representa porcentajes como decimales:
     *
     * 0.25 = 25%
     * 0.50 = 50%
     * 1.00 = 100%
     */
    return value / total;
  }

  private static formatLabel(value: string): string {
    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private static formatFilterValues(values: string[]): string {
    if (values.length === 0) {
      return 'Todos';
    }

    return values.map((value) => this.formatLabel(value)).join(' | ');
  }

  private static formatIdFilter(values: number[]): string {
    if (values.length === 0) {
      return 'Todos';
    }

    return values.join(', ');
  }

  private static formatNames(values: string[]): string {
    if (values.length === 0) {
      return this.EMPTY;
    }

    return values.join(' | ');
  }

  private static formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',

      timeZone: this.TZ,
    }).format(value);
  }

  /**
   * El dominio usa [desde, hastaExclusivo).
   *
   * Para mostrarlo al usuario convertimos el
   * límite superior exclusivo en la fecha
   * calendario inclusiva correspondiente.
   */
  private static formatInclusiveEndDate(hastaExclusivo: Date): string {
    const ultimoInstante = new Date(hastaExclusivo.getTime() - 1);

    return this.formatDate(ultimoInstante);
  }

  private static buildFilename(data: TicketReporteData): string {
    const desde = this.dateKey(data.metadata.desdeInclusivo);

    const hasta = this.dateKey(
      new Date(data.metadata.hastaExclusivo.getTime() - 1),
    );

    const generado = this.dateTimeKey(data.metadata.generadoEn);

    return (
      ['reporte-tickets', `${desde}-a-${hasta}`, generado].join('-') + '.xlsx'
    );
  }

  private static dateKey(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',

      timeZone: this.TZ,
    }).formatToParts(value);

    const year = parts.find((part) => part.type === 'year')?.value ?? '0000';

    const month = parts.find((part) => part.type === 'month')?.value ?? '00';

    const day = parts.find((part) => part.type === 'day')?.value ?? '00';

    return `${year}${month}${day}`;
  }

  private static dateTimeKey(value: Date): string {
    const date = this.dateKey(value);

    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',

      hourCycle: 'h23',

      timeZone: this.TZ,
    }).formatToParts(value);

    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';

    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';

    const second = parts.find((part) => part.type === 'second')?.value ?? '00';

    return `${date}-${hour}${minute}${second}`;
  }

  private static formatDuration(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
      return this.EMPTY;
    }

    /**
     * Los promedios pueden contener decimales.
     * Para presentación administrativa redondeamos
     * al minuto más cercano.
     */
    const totalMinutes = Math.max(0, Math.round(value));

    const days = Math.floor(totalMinutes / 1440);

    const remainingAfterDays = totalMinutes % 1440;

    const hours = Math.floor(remainingAfterDays / 60);

    const minutes = remainingAfterDays % 60;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days} d`);
    }

    if (hours > 0) {
      parts.push(`${hours} h`);
    }

    if (minutes > 0 || parts.length === 0) {
      parts.push(`${minutes} min`);
    }

    return parts.join(' ');
  }

  private static formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',

      hour: '2-digit',
      minute: '2-digit',

      hourCycle: 'h23',

      timeZone: this.TZ,
    })
      .format(value)
      .replace(',', '');
  }

  private static formatDateTimeNullable(value: Date | null): string {
    if (!value) {
      return this.EMPTY;
    }

    return this.formatDateTime(value);
  }

  private static valueOrEmpty(
    value: string | number | Date | null | undefined,
  ): XlsxCellValue {
    return value ?? this.EMPTY;
  }
}
