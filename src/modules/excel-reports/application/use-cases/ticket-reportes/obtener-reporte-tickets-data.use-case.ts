import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TicketReporteFilters } from 'src/modules/excel-reports/domain/filters/ticket-reporte/tickets-query-filters';
import {
  TICKET_REPORTE_QUERY_PORT,
  TicketReporteQueryParams,
  TicketReporteQueryPort,
} from 'src/modules/excel-reports/domain/ports/ticket-reportes/ticket-reporte-query.port';
import { TicketReporteData } from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-data';
import { TicketReportePeriodosFactory } from '../../factory/tickets-report/ticket-reporte-periodos.factory';
import { TicketReporteDataBuilder } from '../../builders/tickets-reportes/ticket-reporte-data.builder';
import { TicketReporteRow } from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-row';

@Injectable()
export class ObtenerReporteTicketsDataUseCase {
  constructor(
    @Inject(TICKET_REPORTE_QUERY_PORT)
    private readonly ticketReporteQuery: TicketReporteQueryPort,
  ) {}

  async execute(filters: TicketReporteFilters): Promise<TicketReporteData> {
    const generadoEn = new Date();

    //  NORMALIZAR RANGO Y AGRUPACIÓN

    const rango = TicketReportePeriodosFactory.normalizar(filters, generadoEn);

    // NORMALIZAR FILTROS

    const estados = [...new Set(filters.estados ?? [])];

    const prioridades = [...new Set(filters.prioridades ?? [])];

    const etiquetaIds = this.normalizarIds(filters.etiquetaIds);

    const tecnicoIds = this.normalizarIds(filters.tecnicoIds);

    const clienteId = filters.clienteId ?? null;

    const queryParams: TicketReporteQueryParams = {
      desdeInclusivo: rango.desdeInclusivo,

      hastaExclusivo: rango.hastaExclusivo,

      estados,

      prioridades,

      etiquetaIds,

      tecnicoIds,

      clienteId,
    };

    //  CONSULTAR UNA SOLA VEZ EL UNIVERSO

    const tickets = await this.ticketReporteQuery.findRows(queryParams);

    //  VALIDAR GRANULARIDAD

    this.assertTicketsUnicos(tickets);

    // CREAR BUCKETS DEL PERÍODO

    const buckets = TicketReportePeriodosFactory.crearBuckets(rango);

    //DERIVAR TODAS LAS VISTAS

    const dashboard = TicketReporteDataBuilder.buildDashboard(tickets);

    const periodos = TicketReporteDataBuilder.buildPeriodos(tickets, buckets);

    const tecnicos = TicketReporteDataBuilder.buildTecnicos(tickets);

    //  RESPUESTA CONSOLIDADA

    return {
      metadata: {
        generadoEn,

        desdeInclusivo: rango.desdeInclusivo,

        hastaExclusivo: rango.hastaExclusivo,

        agrupacionSolicitada: rango.agrupacionSolicitada,

        agrupacionEfectiva: rango.agrupacionEfectiva,

        filtros: {
          estados,

          prioridades,

          etiquetaIds,

          tecnicoIds,

          clienteId,
        },
      },

      dashboard,

      periodos,

      tecnicos,

      tickets,
    };
  }

  // HELPERS

  private normalizarIds(ids?: number[]): number[] {
    return [
      ...new Set((ids ?? []).filter((id) => Number.isInteger(id) && id > 0)),
    ];
  }

  /**
   * La implementación del puerto tiene una regla
   * contractual muy importante:
   *
   * 1 TicketSoporte = 1 TicketReporteRow.
   *
   * Si Prisma devuelve dos filas con el mismo ticketId,
   * NO queremos ocultarlo con un Set silenciosamente.
   * Eso significaría que el adapter está violando
   * el contrato y podría alterar las métricas.
   */
  private assertTicketsUnicos(tickets: TicketReporteRow[]): void {
    const ids = new Set<number>();

    for (const ticket of tickets) {
      if (ids.has(ticket.ticketId)) {
        throw new InternalServerErrorException(
          `El reporte de tickets recibió el ticket ${ticket.ticketId} más de una vez.`,
        );
      }

      ids.add(ticket.ticketId);
    }
  }
}
