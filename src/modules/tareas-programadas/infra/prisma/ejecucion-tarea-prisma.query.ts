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

import { OrdenEjecucionTarea } from '../../domain/enums/orden-ejecucion-tarea.enum';
import { EjecucionTareaQueryPort } from '../../domain/ports/ejecucion-tarea-query.port';
import {
  EjecucionTareaFiltros,
  EjecucionTareaListItem,
} from '../../domain/read-models/ejecucion-tarea-listado.read-model';
import { EjecucionTareaPrismaMapper } from './ejecucion-tarea-prisma.mapper';

const ORDEN: Record<
  OrdenEjecucionTarea,
  (
    dir: DireccionOrden,
  ) => Prisma.TareaProgramadaEjecucionOrderByWithRelationInput
> = {
  [OrdenEjecucionTarea.INICIADA_EN]: (dir) => ({ iniciadaEn: dir }),
  [OrdenEjecucionTarea.FECHA_OPERATIVA]: (dir) => ({ fechaOperativa: dir }),
};

@Injectable()
export class EjecucionTareaPrismaQuery implements EjecucionTareaQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: EjecucionTareaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<EjecucionTareaListItem>> {
    const where = this.construirWhere(filtros);
    const dir = filtros.sortDir ?? 'desc';
    const orden = ORDEN[filtros.sortBy ?? OrdenEjecucionTarea.INICIADA_EN];

    const [records, total] = await this.prisma.$transaction([
      this.prisma.tareaProgramadaEjecucion.findMany({
        where,
        orderBy: [orden(dir), { id: dir }],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.tareaProgramadaEjecucion.count({ where }),
    ]);

    const items = records.map((record) => {
      const props = EjecucionTareaPrismaMapper.toDomain(record).toPrimitives();
      return { ...props, id: record.id };
    });
    return crearResultadoPaginado(items, total, paginacion);
  }

  private construirWhere(
    filtros: EjecucionTareaFiltros,
  ): Prisma.TareaProgramadaEjecucionWhereInput {
    const fecha: Prisma.DateTimeFilter = {};
    if (filtros.desde) {
      fecha.gte = EjecucionTareaPrismaMapper.fechaDb(filtros.desde);
    }
    if (filtros.hasta) {
      fecha.lte = EjecucionTareaPrismaMapper.fechaDb(filtros.hasta);
    }

    return {
      ...(filtros.desde || filtros.hasta ? { fechaOperativa: fecha } : {}),
      ...(filtros.tarea ? { tarea: filtros.tarea } : {}),
      ...(filtros.estados?.length
        ? {
            estado: {
              in: filtros.estados.map(EjecucionTareaPrismaMapper.estadoDb),
            },
          }
        : {}),
      ...(filtros.facturacionZonaId
        ? { facturacionZonaId: filtros.facturacionZonaId }
        : {}),
      ...(filtros.search
        ? { clave: { contains: filtros.search, mode: 'insensitive' } }
        : {}),
    };
  }
}
