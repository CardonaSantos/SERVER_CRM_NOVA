import { Injectable } from '@nestjs/common';

import {
  EstadoTicketSoporte,
  Prisma,
  PrioridadTicketSoporte,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { type TicketReporteEstado as TicketReporteEstadoType } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import { type TicketReportePrioridad as TicketReportePrioridadType } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';
import {
  TicketReporteQueryParams,
  TicketReporteQueryPort,
} from '../../../domain/ports/ticket-reportes/ticket-reporte-query.port';
import { TicketReportePrismaMapper } from './ticket-reporte-prisma.mapper';
import { selectTicketSoporteReport } from './ticket-reporte-selects.query';
import { TicketReporteEstado } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import { TicketReportePrioridad } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';
import { TicketReporteRow } from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-row';

// MAPEO DOMINIO -> PRISMA

const ESTADO_TO_PRISMA: Record<TicketReporteEstadoType, EstadoTicketSoporte> = {
  [TicketReporteEstado.NUEVO]: EstadoTicketSoporte.NUEVO,

  [TicketReporteEstado.ABIERTA]: EstadoTicketSoporte.ABIERTA,

  [TicketReporteEstado.EN_PROCESO]: EstadoTicketSoporte.EN_PROCESO,

  [TicketReporteEstado.PENDIENTE]: EstadoTicketSoporte.PENDIENTE,

  [TicketReporteEstado.PENDIENTE_CLIENTE]:
    EstadoTicketSoporte.PENDIENTE_CLIENTE,

  [TicketReporteEstado.PENDIENTE_TECNICO]:
    EstadoTicketSoporte.PENDIENTE_TECNICO,

  [TicketReporteEstado.PENDIENTE_REVISION]:
    EstadoTicketSoporte.PENDIENTE_REVISION,

  [TicketReporteEstado.RESUELTA]: EstadoTicketSoporte.RESUELTA,

  [TicketReporteEstado.CERRADO]: EstadoTicketSoporte.CERRADO,

  [TicketReporteEstado.CANCELADA]: EstadoTicketSoporte.CANCELADA,

  [TicketReporteEstado.ARCHIVADA]: EstadoTicketSoporte.ARCHIVADA,
};

const PRIORIDAD_TO_PRISMA: Record<
  TicketReportePrioridadType,
  PrioridadTicketSoporte
> = {
  [TicketReportePrioridad.BAJA]: PrioridadTicketSoporte.BAJA,

  [TicketReportePrioridad.MEDIA]: PrioridadTicketSoporte.MEDIA,

  [TicketReportePrioridad.ALTA]: PrioridadTicketSoporte.ALTA,

  [TicketReportePrioridad.URGENTE]: PrioridadTicketSoporte.URGENTE,
};

// QUERY ADAPTER

@Injectable()
export class TicketReportePrismaQuery implements TicketReporteQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  // FIND ROWS

  async findRows(
    params: TicketReporteQueryParams,
  ): Promise<TicketReporteRow[]> {
    const where = this.buildWhere(params);

    const tickets = await this.prisma.ticketSoporte.findMany({
      where,

      /**
       * Select raíz.
       *
       * Las relaciones múltiples permanecen anidadas:
       *
       * - asignaciones[]
       * - etiquetas[]
       * - logsTiempo[]
       *
       * Por lo tanto:
       *
       * 1 TicketSoporte = 1 elemento del resultado.
       */
      select: selectTicketSoporteReport,

      orderBy: [
        {
          fechaApertura: 'asc',
        },

        {
          id: 'asc',
        },
      ],
    });

    return tickets.map((ticket) => TicketReportePrismaMapper.toRow(ticket));
  }

  // WHERE

  private buildWhere(
    params: TicketReporteQueryParams,
  ): Prisma.TicketSoporteWhereInput {
    const conditions: Prisma.TicketSoporteWhereInput[] = [];

    // 1. UNIVERSO TEMPORAL

    conditions.push({
      fechaApertura: {
        gte: params.desdeInclusivo,

        lt: params.hastaExclusivo,
      },
    });

    //  ESTADOS

    if (params.estados.length > 0) {
      conditions.push({
        estado: {
          in: params.estados.map((estado) => ESTADO_TO_PRISMA[estado]),
        },
      });
    }

    //  PRIORIDADES

    if (params.prioridades.length > 0) {
      conditions.push({
        prioridad: {
          in: params.prioridades.map(
            (prioridad) => PRIORIDAD_TO_PRISMA[prioridad],
          ),
        },
      });
    }

    //  ETIQUETAS

    if (params.etiquetaIds.length > 0) {
      conditions.push({
        etiquetas: {
          some: {
            etiquetaId: {
              in: params.etiquetaIds,
            },
          },
        },
      });
    }

    //  TÉCNICOS

    if (params.tecnicoIds.length > 0) {
      conditions.push({
        OR: [
          /**
           * Participación como técnico principal.
           */
          {
            tecnicoId: {
              in: params.tecnicoIds,
            },
          },

          /**
           * Participación como técnico adicional.
           */
          {
            asignaciones: {
              some: {
                tecnicoId: {
                  in: params.tecnicoIds,
                },
              },
            },
          },
        ],
      });
    }

    //  CLIENTE

    if (params.clienteId !== null) {
      conditions.push({
        clienteId: params.clienteId,
      });
    }

    // RESULTADO

    return {
      AND: conditions,
    };
  }
}
