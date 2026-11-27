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
import { OrdenSector } from '../../domain/enums/orden-sector.enum';
import { SectorQueryPort } from '../../domain/ports/sector-query.port';
import {
  SectorFiltros,
  SectorListItem,
  SectorOpcion,
} from '../../domain/read-models/sector-listado.read-model';

const CLIENTES_VIGENTES = {
  select: { clientes: { where: { isEliminado: false } } },
} satisfies Prisma.SectorCountOutputTypeDefaultArgs;

const SELECCION = {
  id: true,
  nombre: true,
  descripcion: true,
  creadoEn: true,
  actualizadoEn: true,
  municipio: {
    select: {
      id: true,
      nombre: true,
      departamento: { select: { id: true, nombre: true } },
    },
  },
  _count: CLIENTES_VIGENTES,
  // Basta saber si existe uno, aunque esté eliminado.
  clientes: { select: { id: true }, take: 1 },
} satisfies Prisma.SectorSelect;

type Registro = Prisma.SectorGetPayload<{ select: typeof SELECCION }>;

const ORDEN: Record<
  OrdenSector,
  (dir: DireccionOrden) => Prisma.SectorOrderByWithRelationInput
> = {
  [OrdenSector.NOMBRE]: (dir) => ({ nombre: dir }),
  [OrdenSector.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

function aListItem(record: Registro): SectorListItem {
  const { departamento, ...municipio } = record.municipio;

  return {
    id: record.id,
    nombre: record.nombre,
    descripcion: record.descripcion,
    municipio,
    departamento,
    creadoEn: record.creadoEn,
    actualizadoEn: record.actualizadoEn,
    clientes: record._count.clientes,
    eliminable: record.clientes.length === 0,
  };
}

@Injectable()
export class SectorPrismaQuery implements SectorQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: SectorFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<SectorListItem>> {
    const where = this.construirWhere(filtros);
    const dir = filtros.sortDir ?? 'asc';

    const [records, total] = await this.prisma.$transaction([
      this.prisma.sector.findMany({
        where,
        select: SELECCION,
        orderBy: [
          ...(filtros.sortBy ? [ORDEN[filtros.sortBy](dir)] : []),
          { id: filtros.sortBy ? 'asc' : dir },
        ],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.sector.count({ where }),
    ]);

    return crearResultadoPaginado(records.map(aListItem), total, paginacion);
  }

  async findDetail(id: number): Promise<SectorListItem | null> {
    const record = await this.prisma.sector.findFirst({
      where: { id, eliminadoEn: null },
      select: SELECCION,
    });

    return record ? aListItem(record) : null;
  }

  async findOpciones(municipioId?: number): Promise<SectorOpcion[]> {
    const records = await this.prisma.sector.findMany({
      where: this.construirWhere({ municipioId }),
      select: {
        id: true,
        nombre: true,
        municipioId: true,
        _count: CLIENTES_VIGENTES,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });

    return records.map((record) => ({
      id: record.id,
      nombre: record.nombre,
      municipioId: record.municipioId,
      clientes: record._count.clientes,
    }));
  }

  private construirWhere(filtros: SectorFiltros): Prisma.SectorWhereInput {
    const { search, departamentoId, municipioId } = filtros;

    return {
      eliminadoEn: null,
      ...(municipioId !== undefined && { municipioId }),
      ...(departamentoId !== undefined && { municipio: { departamentoId } }),
      ...(search && { nombre: { contains: search, mode: 'insensitive' } }),
    };
  }
}
