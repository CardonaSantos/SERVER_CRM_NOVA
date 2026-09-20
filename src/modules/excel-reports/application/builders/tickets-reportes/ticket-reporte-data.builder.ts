import { type TicketReporteEstado as TicketReporteEstadoType } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import { TicketReporteEstado } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import {
  TicketReporteCantidadPorCategoria,
  TicketReporteDashboard,
} from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-dashboard';
import { TicketReporteRow } from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-row';
import { TicketReportePeriodoBucket } from '../../factory/tickets-report/ticket-reporte-periodos.factory';
import { TicketReportePeriodoRow } from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-periodo';
import { TicketReportePrioridad } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';
import { TicketReporteTecnicoRow } from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-tecnico';
import { type TicketReportePrioridad as TicketReportePrioridadType } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';

const ESTADOS_FINALIZADOS = new Set<TicketReporteEstadoType>([
  TicketReporteEstado.RESUELTA,
  TicketReporteEstado.CERRADO,
]);

const ESTADOS_NO_PENDIENTES = new Set<TicketReporteEstadoType>([
  TicketReporteEstado.RESUELTA,
  TicketReporteEstado.CERRADO,
  TicketReporteEstado.CANCELADA,
  TicketReporteEstado.ARCHIVADA,
]);

// BUILDER

export class TicketReporteDataBuilder {
  // DASHBOARD

  static buildDashboard(tickets: TicketReporteRow[]): TicketReporteDashboard {
    const totalFinalizados = tickets.filter((ticket) =>
      this.esFinalizado(ticket),
    ).length;

    const totalPendientes = tickets.filter((ticket) =>
      this.esPendiente(ticket),
    ).length;

    const totalSinTecnico = tickets.filter(
      (ticket) => ticket.participantes.length === 0,
    ).length;

    // ===================================================
    // MUESTRAS TEMPORALES
    // ===================================================

    const tiemposAsignacion = tickets.map(
      (ticket) => ticket.tiempoHastaAsignacionMinutos,
    );

    const tiemposPrimeraAtencion = tickets.map(
      (ticket) => ticket.tiempoHastaPrimeraAtencionMinutos,
    );

    const tiemposResolucionTecnica = tickets.map(
      (ticket) => ticket.tiempoHastaResolucionTecnicaMinutos,
    );

    const tiemposTecnicosRegistrados = tickets.map(
      (ticket) => ticket.tiempoTecnicoRegistradoMinutos,
    );

    const tiemposTotales = tickets.map((ticket) => ticket.tiempoTotalMinutos);

    return {
      totalTickets: tickets.length,

      totalFinalizados,

      totalPendientes,

      totalSinTecnico,

      porEstado: this.buildDistribucionEstados(tickets),

      porPrioridad: this.buildDistribucionPrioridades(tickets),

      topEtiquetas: this.buildTopEtiquetas(tickets),

      topClientes: this.buildTopClientes(tickets),

      tiempos: {
        promedioHastaAsignacionMinutos:
          this.promedioNullable(tiemposAsignacion),

        muestrasHastaAsignacion: this.countMeasured(tiemposAsignacion),

        promedioHastaPrimeraAtencionMinutos: this.promedioNullable(
          tiemposPrimeraAtencion,
        ),

        muestrasHastaPrimeraAtencion: this.countMeasured(
          tiemposPrimeraAtencion,
        ),

        promedioHastaResolucionTecnicaMinutos: this.promedioNullable(
          tiemposResolucionTecnica,
        ),

        muestrasHastaResolucionTecnica: this.countMeasured(
          tiemposResolucionTecnica,
        ),

        promedioTiempoTecnicoRegistradoMinutos: this.promedioNullable(
          tiemposTecnicosRegistrados,
        ),

        muestrasTiempoTecnicoRegistrado: this.countMeasured(
          tiemposTecnicosRegistrados,
        ),

        promedioTiempoTotalMinutos: this.promedioNullable(tiemposTotales),

        muestrasTiempoTotal: this.countMeasured(tiemposTotales),
      },
    };
  }

  // PERÍODO

  static buildPeriodos(
    tickets: TicketReporteRow[],
    buckets: TicketReportePeriodoBucket[],
  ): TicketReportePeriodoRow[] {
    return buckets.map((bucket) => {
      const desdeMs = bucket.desde.getTime();

      const hastaMs = bucket.hastaExclusivo.getTime();

      const ticketsBucket = tickets.filter((ticket) => {
        const aperturaMs = ticket.fechaApertura.getTime();

        return aperturaMs >= desdeMs && aperturaMs < hastaMs;
      });

      return {
        periodo: bucket.periodo,

        etiqueta: bucket.etiqueta,

        desde: bucket.desde,

        hastaExclusivo: bucket.hastaExclusivo,

        totalTickets: ticketsBucket.length,

        totalFinalizados: ticketsBucket.filter((ticket) =>
          this.esFinalizado(ticket),
        ).length,

        totalPendientes: ticketsBucket.filter((ticket) =>
          this.esPendiente(ticket),
        ).length,

        totalUrgentes: ticketsBucket.filter(
          (ticket) => ticket.prioridad === TicketReportePrioridad.URGENTE,
        ).length,

        promedioHastaAsignacionMinutos: this.promedioNullable(
          ticketsBucket.map((ticket) => ticket.tiempoHastaAsignacionMinutos),
        ),

        promedioHastaPrimeraAtencionMinutos: this.promedioNullable(
          ticketsBucket.map(
            (ticket) => ticket.tiempoHastaPrimeraAtencionMinutos,
          ),
        ),

        promedioHastaResolucionTecnicaMinutos: this.promedioNullable(
          ticketsBucket.map(
            (ticket) => ticket.tiempoHastaResolucionTecnicaMinutos,
          ),
        ),

        promedioTiempoTecnicoRegistradoMinutos: this.promedioNullable(
          ticketsBucket.map((ticket) => ticket.tiempoTecnicoRegistradoMinutos),
        ),

        promedioTiempoTotalMinutos: this.promedioNullable(
          ticketsBucket.map((ticket) => ticket.tiempoTotalMinutos),
        ),
      };
    });
  }

  // TÉCNICOS

  static buildTecnicos(tickets: TicketReporteRow[]): TicketReporteTecnicoRow[] {
    interface TecnicoAccumulator {
      tecnicoId: number;
      tecnicoNombre: string;

      tickets: TicketReporteRow[];

      comoPrincipal: number;
      comoApoyo: number;
    }

    const map = new Map<number, TecnicoAccumulator>();

    for (const ticket of tickets) {
      /**
       * Protección adicional.
       *
       * Aunque TicketReporteRow.participantes ya debe
       * venir deduplicado, evitamos contar dos veces
       * un mismo técnico dentro del mismo ticket.
       */
      const participantesVistos = new Set<number>();

      for (const participante of ticket.participantes) {
        if (participantesVistos.has(participante.tecnicoId)) {
          continue;
        }

        participantesVistos.add(participante.tecnicoId);

        let tecnico = map.get(participante.tecnicoId);

        if (!tecnico) {
          tecnico = {
            tecnicoId: participante.tecnicoId,

            tecnicoNombre: participante.nombre,

            tickets: [],

            comoPrincipal: 0,

            comoApoyo: 0,
          };

          map.set(participante.tecnicoId, tecnico);
        }

        tecnico.tickets.push(ticket);

        if (participante.tipo === 'PRINCIPAL') {
          tecnico.comoPrincipal += 1;
        } else {
          tecnico.comoApoyo += 1;
        }
      }
    }

    return [...map.values()]
      .map((tecnico) => {
        const ticketsTecnico = tecnico.tickets;

        const tiemposResolucionTecnica = ticketsTecnico.map(
          (ticket) => ticket.tiempoHastaResolucionTecnicaMinutos,
        );

        const tiemposTecnicosRegistrados = ticketsTecnico.map(
          (ticket) => ticket.tiempoTecnicoRegistradoMinutos,
        );

        return {
          tecnicoId: tecnico.tecnicoId,

          tecnicoNombre: tecnico.tecnicoNombre,

          totalParticipaciones: ticketsTecnico.length,

          comoPrincipal: tecnico.comoPrincipal,

          comoApoyo: tecnico.comoApoyo,

          ticketsFinalizados: ticketsTecnico.filter((ticket) =>
            this.esFinalizado(ticket),
          ).length,

          ticketsPendientes: ticketsTecnico.filter((ticket) =>
            this.esPendiente(ticket),
          ).length,

          ticketsUrgentes: ticketsTecnico.filter(
            (ticket) => ticket.prioridad === TicketReportePrioridad.URGENTE,
          ).length,

          // =================================================
          // RESOLUCIÓN DE LOS TICKETS DONDE PARTICIPÓ
          // =================================================

          /**
           * No significa que este técnico haya sido
           * personalmente quien pulsó "resolver".
           *
           * Significa que participó en un ticket que
           * posee una resolución técnica medible.
           */
          ticketsConResolucionTecnica: this.countMeasured(
            tiemposResolucionTecnica,
          ),

          /**
           * Promedio apertura -> resolución técnica
           * de TODOS los tickets donde participó
           * este técnico y existe dicha medición.
           */
          promedioResolucionTecnicaTicketsMinutos: this.promedioNullable(
            tiemposResolucionTecnica,
          ),

          // =================================================
          // OTROS TIEMPOS DE LOS TICKETS PARTICIPADOS
          // =================================================

          promedioHastaAsignacionMinutos: this.promedioNullable(
            ticketsTecnico.map((ticket) => ticket.tiempoHastaAsignacionMinutos),
          ),

          promedioHastaPrimeraAtencionMinutos: this.promedioNullable(
            ticketsTecnico.map(
              (ticket) => ticket.tiempoHastaPrimeraAtencionMinutos,
            ),
          ),

          promedioTiempoTecnicoTicketsMinutos: this.promedioNullable(
            tiemposTecnicosRegistrados,
          ),

          promedioTiempoTotalTicketsMinutos: this.promedioNullable(
            ticketsTecnico.map((ticket) => ticket.tiempoTotalMinutos),
          ),
        };
      })
      .sort((a, b) => {
        if (b.totalParticipaciones !== a.totalParticipaciones) {
          return b.totalParticipaciones - a.totalParticipaciones;
        }

        return a.tecnicoNombre.localeCompare(b.tecnicoNombre, 'es');
      });
  }

  // DISTRIBUCIONES

  private static buildDistribucionEstados(
    tickets: TicketReporteRow[],
  ): Array<TicketReporteCantidadPorCategoria<TicketReporteEstadoType>> {
    const estados = Object.values(
      TicketReporteEstado,
    ) as TicketReporteEstadoType[];

    return estados.map((estado) => ({
      categoria: estado,

      total: tickets.filter((ticket) => ticket.estado === estado).length,
    }));
  }

  private static buildDistribucionPrioridades(
    tickets: TicketReporteRow[],
  ): Array<TicketReporteCantidadPorCategoria<TicketReportePrioridadType>> {
    const prioridades = Object.values(
      TicketReportePrioridad,
    ) as TicketReportePrioridadType[];

    return prioridades.map((prioridad) => ({
      categoria: prioridad,

      total: tickets.filter((ticket) => ticket.prioridad === prioridad).length,
    }));
  }

  private static buildTopEtiquetas(
    tickets: TicketReporteRow[],
  ): TicketReporteDashboard['topEtiquetas'] {
    const map = new Map<
      number,
      {
        etiquetaId: number;
        etiqueta: string;
        totalTickets: number;
      }
    >();

    for (const ticket of tickets) {
      const etiquetasVistas = new Set<number>();

      for (const etiqueta of ticket.etiquetas) {
        if (etiquetasVistas.has(etiqueta.id)) {
          continue;
        }

        etiquetasVistas.add(etiqueta.id);

        const actual = map.get(etiqueta.id);

        if (actual) {
          actual.totalTickets += 1;

          continue;
        }

        map.set(etiqueta.id, {
          etiquetaId: etiqueta.id,

          etiqueta: etiqueta.nombre,

          totalTickets: 1,
        });
      }
    }

    return [...map.values()]
      .sort((a, b) => {
        if (b.totalTickets !== a.totalTickets) {
          return b.totalTickets - a.totalTickets;
        }

        return a.etiqueta.localeCompare(b.etiqueta, 'es');
      })
      .slice(0, 10);
  }

  private static buildTopClientes(
    tickets: TicketReporteRow[],
  ): TicketReporteDashboard['topClientes'] {
    const map = new Map<
      number,
      {
        clienteId: number;
        cliente: string;
        totalTickets: number;
      }
    >();

    for (const ticket of tickets) {
      /**
       * Para un ranking de clientes no incluimos
       * tickets sin cliente relacionado.
       */
      if (ticket.clienteId === null) {
        continue;
      }

      const actual = map.get(ticket.clienteId);

      if (actual) {
        actual.totalTickets += 1;

        continue;
      }

      map.set(ticket.clienteId, {
        clienteId: ticket.clienteId,

        /**
         * En datos legacy podría existir el ID
         * pero faltar la relación/nombre.
         */
        cliente: ticket.clienteNombre ?? `Cliente #${ticket.clienteId}`,

        totalTickets: 1,
      });
    }

    return [...map.values()]
      .sort((a, b) => {
        /**
         * Primero mayor cantidad de tickets.
         */
        if (b.totalTickets !== a.totalTickets) {
          return b.totalTickets - a.totalTickets;
        }

        /**
         * Empates de forma estable por nombre.
         */
        return a.cliente.localeCompare(b.cliente, 'es');
      })
      .slice(0, 10);
  }

  // ESTADO

  private static esFinalizado(ticket: TicketReporteRow): boolean {
    return ESTADOS_FINALIZADOS.has(ticket.estado);
  }

  private static esPendiente(ticket: TicketReporteRow): boolean {
    return !ESTADOS_NO_PENDIENTES.has(ticket.estado);
  }

  // PROMEDIOS

  private static countMeasured(values: Array<number | null>): number {
    return values.filter(
      (value): value is number => value !== null && Number.isFinite(value),
    ).length;
  }

  private static promedio(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    const total = values.reduce((acc, value) => acc + value, 0);

    return this.round(total / values.length);
  }

  private static promedioNullable(values: Array<number | null>): number | null {
    const validos = values.filter(
      (value): value is number => value !== null && Number.isFinite(value),
    );

    return this.promedio(validos);
  }

  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
