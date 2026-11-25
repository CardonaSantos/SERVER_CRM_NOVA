import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  Paginacion,
  ResultadoPaginado,
  aDesplazamiento,
  crearResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';

import { PerfilHomologacionQueryPort } from '../../domain/ports/perfil-homologacion-query.port';
import {
  PerfilHomologacionFiltros,
  PerfilHomologacionListItem,
  PerfilHomologacionSeleccionable,
} from '../../domain/read-models/perfil-homologacion.read-model';

const usuarioResumen = {
  select: { id: true, nombre: true, correo: true, rol: true, activo: true },
} as const;

const includeListado = {
  mikrotikRouter: {
    select: {
      id: true,
      nombre: true,
      host: true,
      sshPort: true,
      descripcion: true,
      activo: true,
    },
  },
  servicioInternet: {
    select: {
      id: true,
      nombre: true,
      velocidad: true,
      precio: true,
      estado: true,
    },
  },
  creadoPor: usuarioResumen,
  actualizadoPor: usuarioResumen,
  _count: { select: { cuentas: true, auditorias: true } },
} satisfies Prisma.PppoePerfilHomologacionInclude;

type RegistroListado = Prisma.PppoePerfilHomologacionGetPayload<{
  include: typeof includeListado;
}>;

@Injectable()
export class PerfilHomologacionPrismaQuery
  implements PerfilHomologacionQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: PerfilHomologacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<PerfilHomologacionListItem>> {
    const where = this.construirWhere(filtros);

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.pppoePerfilHomologacion.findMany({
        where,
        ...aDesplazamiento(paginacion),
        orderBy: [{ activo: 'desc' }, { actualizadoEn: 'desc' }],
        include: includeListado,
      }),
      this.prisma.pppoePerfilHomologacion.count({ where }),
    ]);

    return crearResultadoPaginado(
      registros.map((r) => this.aListItem(r)),
      total,
      paginacion,
    );
  }

  async findSeleccionables(
    search: string | null,
  ): Promise<PerfilHomologacionSeleccionable[]> {
    const where: Prisma.PppoePerfilHomologacionWhereInput = {
      activo: true,
      mikrotikRouter: { is: { activo: true } },
      servicioInternet: { is: { estado: 'ACTIVO' } },
    };

    if (search) {
      where.OR = [
        { codigoPerfil: { contains: search, mode: 'insensitive' } },
        {
          mikrotikRouter: {
            is: { nombre: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          servicioInternet: {
            is: { nombre: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    return this.prisma.pppoePerfilHomologacion.findMany({
      where,
      orderBy: [
        { servicioInternet: { nombre: 'asc' } },
        { mikrotikRouter: { nombre: 'asc' } },
        { codigoPerfil: 'asc' },
      ],
      select: {
        id: true,
        codigoPerfil: true,
        mikrotikRouterId: true,
        servicioInternetId: true,
        mikrotikRouter: { select: { id: true, nombre: true } },
        servicioInternet: {
          select: { id: true, nombre: true, velocidad: true, precio: true },
        },
      },
    });
  }

  private construirWhere(
    filtros: PerfilHomologacionFiltros,
  ): Prisma.PppoePerfilHomologacionWhereInput {
    const where: Prisma.PppoePerfilHomologacionWhereInput = {};

    if (filtros.activo !== null) where.activo = filtros.activo;
    if (filtros.mikrotikRouterId) {
      where.mikrotikRouterId = filtros.mikrotikRouterId;
    }
    if (filtros.servicioInternetId) {
      where.servicioInternetId = filtros.servicioInternetId;
    }

    const search = filtros.search;
    if (search) {
      const contiene = { contains: search, mode: 'insensitive' } as const;
      where.OR = [
        { codigoPerfil: contiene },
        {
          mikrotikRouter: {
            is: {
              OR: [
                { nombre: contiene },
                { host: contiene },
                { descripcion: contiene },
              ],
            },
          },
        },
        {
          servicioInternet: {
            is: { OR: [{ nombre: contiene }, { velocidad: contiene }] },
          },
        },
      ];
    }

    return where;
  }

  private aListItem(r: RegistroListado): PerfilHomologacionListItem {
    const usuario = (u: RegistroListado['creadoPor']) =>
      u
        ? {
            id: u.id,
            nombre: u.nombre,
            correo: u.correo,
            rol: u.rol,
            activo: u.activo,
          }
        : null;

    return {
      id: r.id,
      empresaId: r.empresaId,
      mikrotikRouterId: r.mikrotikRouterId,
      servicioInternetId: r.servicioInternetId,
      codigoPerfil: r.codigoPerfil,
      activo: r.activo,
      creadoPorId: r.creadoPorId,
      actualizadoPorId: r.actualizadoPorId,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
      mikrotikRouter: {
        id: r.mikrotikRouter.id,
        nombre: r.mikrotikRouter.nombre,
        host: r.mikrotikRouter.host,
        sshPort: r.mikrotikRouter.sshPort,
        descripcion: r.mikrotikRouter.descripcion,
        activo: r.mikrotikRouter.activo,
      },
      servicioInternet: {
        id: r.servicioInternet.id,
        nombre: r.servicioInternet.nombre,
        velocidad: r.servicioInternet.velocidad,
        precio: r.servicioInternet.precio,
        estado: r.servicioInternet.estado,
      },
      creadoPor: usuario(r.creadoPor),
      actualizadoPor: usuario(r.actualizadoPor),
      conteos: {
        cuentas: r._count.cuentas,
        auditorias: r._count.auditorias,
      },
    };
  }
}
