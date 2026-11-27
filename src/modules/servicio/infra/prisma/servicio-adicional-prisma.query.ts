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
import { OrdenServicioAdicional } from '../../domain/enums/orden-servicio-adicional.enum';
import { ServicioAdicionalQueryPort } from '../../domain/ports/servicio-adicional-query.port';
import {
  ServicioAdicionalFiltros,
  ServicioAdicionalListItem,
  ServicioAdicionalOpcion,
} from '../../domain/read-models/servicio-adicional-listado.read-model';
import { ServicioAdicionalPrismaMapper } from './servicio-adicional-prisma.mapper';

/** Basta saber si existe uno para descartar el borrado. */
const ALGUNO = { select: { id: true }, take: 1 } as const;

const SELECCION = {
  id: true,
  nombre: true,
  descripcion: true,
  precio: true,
  estado: true,
  creadoEn: true,
  actualizadoEn: true,
  tipoServicio: { select: { id: true, nombre: true } },
  _count: {
    select: { clientes: { where: { cliente: { isEliminado: false } } } },
  },
  clientes: ALGUNO,
  FacturaServicio: ALGUNO,
} satisfies Prisma.ServicioSelect;

type Registro = Prisma.ServicioGetPayload<{ select: typeof SELECCION }>;

const ORDEN: Record<
  OrdenServicioAdicional,
  (dir: DireccionOrden) => Prisma.ServicioOrderByWithRelationInput
> = {
  [OrdenServicioAdicional.NOMBRE]: (dir) => ({ nombre: dir }),
  [OrdenServicioAdicional.PRECIO]: (dir) => ({ precio: dir }),
  [OrdenServicioAdicional.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

function aListItem(record: Registro): ServicioAdicionalListItem {
  return {
    id: record.id,
    nombre: record.nombre,
    descripcion: record.descripcion,
    precio: record.precio,
    estado: ServicioAdicionalPrismaMapper.estadoDeDominio(record.estado),
    tipo: record.tipoServicio,
    creadoEn: record.creadoEn,
    actualizadoEn: record.actualizadoEn,
    clientes: record._count.clientes,
    eliminable:
      record.clientes.length === 0 && record.FacturaServicio.length === 0,
  };
}

@Injectable()
export class ServicioAdicionalPrismaQuery
  implements ServicioAdicionalQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: ServicioAdicionalFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ServicioAdicionalListItem>> {
    const where = this.construirWhere(filtros);
    const dir = filtros.sortDir ?? 'asc';

    const [records, total] = await this.prisma.$transaction([
      this.prisma.servicio.findMany({
        where,
        select: SELECCION,
        orderBy: [
          ...(filtros.sortBy ? [ORDEN[filtros.sortBy](dir)] : []),
          { id: filtros.sortBy ? 'asc' : dir },
        ],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.servicio.count({ where }),
    ]);

    return crearResultadoPaginado(records.map(aListItem), total, paginacion);
  }

  async findDetail(id: number): Promise<ServicioAdicionalListItem | null> {
    const record = await this.prisma.servicio.findFirst({
      where: { id, eliminadoEn: null },
      select: SELECCION,
    });

    return record ? aListItem(record) : null;
  }

  async findOpciones(): Promise<ServicioAdicionalOpcion[]> {
    const records = await this.prisma.servicio.findMany({
      where: this.construirWhere({}),
      select: { id: true, nombre: true, precio: true, estado: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });

    return records.map((record) => ({
      ...record,
      estado: ServicioAdicionalPrismaMapper.estadoDeDominio(record.estado),
    }));
  }

  private construirWhere(
    filtros: ServicioAdicionalFiltros,
  ): Prisma.ServicioWhereInput {
    const { search, estados, tipoServicioId } = filtros;

    return {
      eliminadoEn: null,
      ...(tipoServicioId !== undefined && { tipoServicioId }),
      ...(estados?.length && {
        estado: {
          in: estados.map((estado) =>
            ServicioAdicionalPrismaMapper.estadoPersistido(estado),
          ),
        },
      }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  }
}
