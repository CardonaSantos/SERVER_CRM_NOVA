import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  esFechaNegocioValida,
  inicioDiaNegocio,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketSoporteHistorialQueryPort } from '../../domain/ports/ticket-soporte-historial-query.port';
import {
  TicketSoporteHistorialFiltros,
  TicketSoporteHistorialResumen,
} from '../../domain/read-models/ticket-soporte-historial.read-model';
import { TicketSoporteHistorialPrismaMapper } from './ticket-soporte-historial-prisma.mapper';

@Injectable()
export class TicketSoporteHistorialPrismaQuery
  implements TicketSoporteHistorialQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: TicketSoporteHistorialFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TicketSoporteHistorialResumen>> {
    const where = this.construirWhere(filtros);
    const direccion = filtros.orden ?? 'desc';

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.ticketSoporteHistorial.findMany({
        where,
        orderBy: [{ creadoEn: direccion }, { id: direccion }],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.ticketSoporteHistorial.count({ where }),
    ]);

    return crearResultadoPaginado(
      registros.map((registro) =>
        TicketSoporteHistorialPrismaMapper.toResumen(registro),
      ),
      total,
      paginacion,
    );
  }

  async findById(id: number): Promise<TicketSoporteHistorialResumen | null> {
    const registro = await this.prisma.ticketSoporteHistorial.findUnique({
      where: { id },
    });

    return registro
      ? TicketSoporteHistorialPrismaMapper.toResumen(registro)
      : null;
  }

  private construirWhere(
    filtros: TicketSoporteHistorialFiltros,
  ): Prisma.TicketSoporteHistorialWhereInput {
    const creadoEn = this.construirRangoFechas(
      filtros.fechaDesde,
      filtros.fechaHasta,
    );

    return {
      ...(filtros.ticketId && { ticketId: filtros.ticketId }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.tipo && {
        tipo: TicketSoporteHistorialPrismaMapper.toPrismaTipo(filtros.tipo),
      }),
      ...(creadoEn && { creadoEn }),
      ...(filtros.search && {
        OR: [
          { descripcion: { contains: filtros.search, mode: 'insensitive' } },
          { usuarioNombre: { contains: filtros.search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  /**
   * `YYYY-MM-DD` cubre el día completo de Guatemala (§7.6); una fecha con
   * hora es el instante exacto y el límite superior lo incluye.
   */
  private construirRangoFechas(
    desde?: string,
    hasta?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!desde && !hasta) return undefined;

    const rango: Prisma.DateTimeFilter = {};

    if (desde) {
      rango.gte = esFechaNegocioValida(desde)
        ? inicioDiaNegocio(desde)
        : new Date(desde);
    }

    if (hasta) {
      if (esFechaNegocioValida(hasta)) {
        rango.lt = rangoDiasNegocio(undefined, hasta).lt;
      } else {
        rango.lte = new Date(hasta);
      }
    }

    return rango;
  }
}
