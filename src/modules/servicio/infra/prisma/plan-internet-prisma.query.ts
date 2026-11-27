import { Injectable } from '@nestjs/common';
import { EstadoCliente, Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  DireccionOrden,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdenPlanInternet } from '../../domain/enums/orden-plan-internet.enum';
import { PlanInternetQueryPort } from '../../domain/ports/plan-internet-query.port';
import {
  PlanInternetDetalle,
  PlanInternetFiltros,
  PlanInternetListItem,
  PlanInternetOpcion,
} from '../../domain/read-models/plan-internet-listado.read-model';
import { PlanInternetPrismaMapper } from './plan-internet-prisma.mapper';

/** Basta saber si existe uno para descartar el borrado. */
const ALGUNO = { select: { id: true }, take: 1 } as const;

const SELECCION = {
  id: true,
  nombre: true,
  velocidad: true,
  precio: true,
  estado: true,
  creadoEn: true,
  actualizadoEn: true,
  _count: { select: { clientes: { where: { isEliminado: false } } } },
  clientes: ALGUNO,
  accesosInternet: ALGUNO,
  instalacionesCliente: ALGUNO,
  desinstalacionesCliente: ALGUNO,
  perfilesPppoeHomologados: ALGUNO,
} satisfies Prisma.ServicioInternetSelect;

type Registro = Prisma.ServicioInternetGetPayload<{ select: typeof SELECCION }>;

const ORDEN: Record<
  OrdenPlanInternet,
  (dir: DireccionOrden) => Prisma.ServicioInternetOrderByWithRelationInput
> = {
  [OrdenPlanInternet.NOMBRE]: (dir) => ({ nombre: dir }),
  [OrdenPlanInternet.PRECIO]: (dir) => ({ precio: dir }),
  [OrdenPlanInternet.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

function aListItem(record: Registro): PlanInternetListItem {
  return {
    id: record.id,
    nombre: record.nombre,
    velocidad: record.velocidad,
    precio: record.precio,
    estado: PlanInternetPrismaMapper.estadoDeDominio(record.estado),
    creadoEn: record.creadoEn,
    actualizadoEn: record.actualizadoEn,
    clientes: record._count.clientes,
    eliminable: [
      record.clientes,
      record.accesosInternet,
      record.instalacionesCliente,
      record.desinstalacionesCliente,
      record.perfilesPppoeHomologados,
    ].every((uso) => uso.length === 0),
  };
}

@Injectable()
export class PlanInternetPrismaQuery implements PlanInternetQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: PlanInternetFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<PlanInternetListItem>> {
    const where = this.construirWhere(filtros);
    const dir = filtros.sortDir ?? 'asc';

    const [records, total] = await this.prisma.$transaction([
      this.prisma.servicioInternet.findMany({
        where,
        select: SELECCION,
        orderBy: [
          ...(filtros.sortBy ? [ORDEN[filtros.sortBy](dir)] : []),
          { id: filtros.sortBy ? 'asc' : dir },
        ],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.servicioInternet.count({ where }),
    ]);

    return crearResultadoPaginado(records.map(aListItem), total, paginacion);
  }

  async findDetail(id: number): Promise<PlanInternetDetalle | null> {
    const where = { servicioInternetId: id };
    const record = await this.prisma.servicioInternet.findFirst({
      where: { id, eliminadoEn: null },
      select: SELECCION,
    });
    if (!record) return null;

    const [
      clientesFacturables,
      clientesEliminados,
      accesos,
      instalaciones,
      desinstalaciones,
      homologaciones,
    ] = await this.prisma.$transaction([
      this.prisma.clienteInternet.count({
        where: {
          ...where,
          isEliminado: false,
          desinstaladoEn: null,
          estadoCliente: EstadoCliente.ACTIVO,
        },
      }),
      this.prisma.clienteInternet.count({
        where: { ...where, isEliminado: true },
      }),
      this.prisma.clienteAccesoInternet.count({ where }),
      this.prisma.clienteInstalacion.count({ where }),
      this.prisma.clienteDesinstalacion.count({ where }),
      this.prisma.pppoePerfilHomologacion.count({ where }),
    ]);

    return {
      ...aListItem(record),
      clientesFacturables,
      uso: {
        clientesEliminados,
        accesos,
        instalaciones,
        desinstalaciones,
        homologaciones,
      },
    };
  }

  async findOpciones(): Promise<PlanInternetOpcion[]> {
    const records = await this.prisma.servicioInternet.findMany({
      where: this.construirWhere({}),
      select: {
        id: true,
        nombre: true,
        velocidad: true,
        precio: true,
        estado: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });

    return records.map((record) => ({
      ...record,
      estado: PlanInternetPrismaMapper.estadoDeDominio(record.estado),
    }));
  }

  private construirWhere(
    filtros: PlanInternetFiltros,
  ): Prisma.ServicioInternetWhereInput {
    const { search, estados } = filtros;

    return {
      eliminadoEn: null,
      ...(estados?.length && {
        estado: {
          in: estados.map((estado) =>
            PlanInternetPrismaMapper.estadoPersistido(estado),
          ),
        },
      }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { velocidad: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  }
}
