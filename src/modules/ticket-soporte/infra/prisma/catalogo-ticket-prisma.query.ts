import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  DireccionOrden,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdenCatalogoTicket } from '../../domain/enums/orden-ticket.enum';
import { CatalogoTicketQueryPort } from '../../domain/ports/catalogo-ticket-query.port';
import {
  CatalogoTicketFiltros,
  EtiquetaTicketListItem,
  SolucionTicketListItem,
} from '../../domain/read-models/catalogo-ticket.read-model';

const ORDEN_ETIQUETA: Record<
  OrdenCatalogoTicket,
  (dir: DireccionOrden) => Prisma.EtiquetaTicketOrderByWithRelationInput
> = {
  [OrdenCatalogoTicket.NOMBRE]: (dir) => ({ nombre: dir }),
  [OrdenCatalogoTicket.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

const ORDEN_SOLUCION: Record<
  OrdenCatalogoTicket,
  (dir: DireccionOrden) => Prisma.SolucionTicketOrderByWithRelationInput
> = {
  [OrdenCatalogoTicket.NOMBRE]: (dir) => ({ solucion: dir }),
  [OrdenCatalogoTicket.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

const contiene = (texto: string) => ({
  contains: texto,
  mode: 'insensitive' as const,
});

@Injectable()
export class CatalogoTicketPrismaQuery implements CatalogoTicketQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findEtiquetas(
    filtros: CatalogoTicketFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<EtiquetaTicketListItem>> {
    const where: Prisma.EtiquetaTicketWhereInput = {
      eliminadoEn: null,
      ...(filtros.search && { nombre: contiene(filtros.search) }),
    };
    const orden = ORDEN_ETIQUETA[filtros.sortBy ?? OrdenCatalogoTicket.NOMBRE];

    const [records, total] = await this.prisma.$transaction([
      this.prisma.etiquetaTicket.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          creadoEn: true,
          _count: { select: { tickets: true } },
        },
        orderBy: [orden(filtros.sortDir ?? 'asc'), { id: 'asc' }],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.etiquetaTicket.count({ where }),
    ]);

    return crearResultadoPaginado(
      records.map(({ _count, ...etiqueta }) => ({
        ...etiqueta,
        tickets: _count.tickets,
      })),
      total,
      paginacion,
    );
  }

  async findSoluciones(
    filtros: CatalogoTicketFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<SolucionTicketListItem>> {
    const where: Prisma.SolucionTicketWhereInput = {
      isEliminado: false,
      ...(filtros.search && {
        OR: [
          { solucion: contiene(filtros.search) },
          { descripcion: contiene(filtros.search) },
        ],
      }),
    };
    const orden = ORDEN_SOLUCION[filtros.sortBy ?? OrdenCatalogoTicket.NOMBRE];

    const [records, total] = await this.prisma.$transaction([
      this.prisma.solucionTicket.findMany({
        where,
        select: {
          id: true,
          solucion: true,
          descripcion: true,
          creadoEn: true,
          _count: { select: { tickets: true } },
        },
        orderBy: [orden(filtros.sortDir ?? 'asc'), { id: 'asc' }],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.solucionTicket.count({ where }),
    ]);

    return crearResultadoPaginado(
      records.map(({ _count, solucion, ...resto }) => ({
        ...resto,
        nombre: solucion,
        tickets: _count.tickets,
      })),
      total,
      paginacion,
    );
  }
}
