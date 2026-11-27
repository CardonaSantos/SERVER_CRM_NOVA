import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  DireccionOrden,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoUsuario } from '../../domain/enums/estado-usuario.enum';
import { OrdenUsuario } from '../../domain/enums/orden-usuario.enum';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { estadoDe } from '../../domain/policies/datos-usuario.policy';
import { UsuarioQueryPort } from '../../domain/ports/usuario-query.port';
import {
  CredencialesUsuario,
  PerfilSesion,
  UsuarioDetalle,
  UsuarioFiltros,
  UsuarioListItem,
  UsuarioOpcion,
} from '../../domain/read-models/usuario-listado.read-model';
import { UsuarioPrismaMapper } from './usuario-prisma.mapper';

const SELECCION = {
  id: true,
  nombre: true,
  correo: true,
  correoEliminado: true,
  telefono: true,
  rol: true,
  activo: true,
  creadoEn: true,
  actualizadoEn: true,
  eliminadoEn: true,
  perfil: { select: { avatarUrl: true, portadaUrl: true } },
} satisfies Prisma.UsuarioSelect;

type Registro = Prisma.UsuarioGetPayload<{ select: typeof SELECCION }>;

const ORDEN: Record<
  OrdenUsuario,
  (dir: DireccionOrden) => Prisma.UsuarioOrderByWithRelationInput
> = {
  [OrdenUsuario.NOMBRE]: (dir) => ({ nombre: dir }),
  [OrdenUsuario.CORREO]: (dir) => ({ correo: dir }),
  [OrdenUsuario.ROL]: (dir) => ({ rol: dir }),
  [OrdenUsuario.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

const POR_ESTADO: Record<EstadoUsuario, Prisma.UsuarioWhereInput> = {
  [EstadoUsuario.ACTIVO]: { eliminadoEn: null, activo: true },
  [EstadoUsuario.INACTIVO]: { eliminadoEn: null, activo: false },
  [EstadoUsuario.ELIMINADO]: { eliminadoEn: { not: null } },
};

function aListItem(r: Registro): UsuarioListItem {
  return {
    id: r.id,
    nombre: r.nombre,
    correo: r.correoEliminado ?? r.correo,
    telefono: r.telefono,
    rol: UsuarioPrismaMapper.rolDeDominio(r.rol),
    estado: estadoDe(r),
    avatarUrl: r.perfil?.avatarUrl ?? null,
    creadoEn: r.creadoEn,
    actualizadoEn: r.actualizadoEn,
    eliminadoEn: r.eliminadoEn,
  };
}

@Injectable()
export class UsuarioPrismaQuery implements UsuarioQueryPort {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async findMany(
    filtros: UsuarioFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<UsuarioListItem>> {
    const where = this.construirWhere(filtros);
    const dir = filtros.sortDir ?? 'asc';

    const [records, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        select: SELECCION,
        orderBy: [
          ORDEN[filtros.sortBy ?? OrdenUsuario.NOMBRE](dir),
          { id: 'asc' },
        ],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return crearResultadoPaginado(records.map(aListItem), total, paginacion);
  }

  async findDetail(id: number): Promise<UsuarioDetalle | null> {
    const ahora = this.reloj.ahora();
    const record = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        ...SELECCION,
        _count: {
          select: {
            sesiones: {
              where: {
                revocadaEn: null,
                expiraAbsolutaEn: { gt: ahora },
                expiraInactividadEn: { gt: ahora },
              },
            },
          },
        },
      },
    });
    if (!record) return null;

    return {
      ...aListItem(record),
      portadaUrl: record.perfil?.portadaUrl ?? null,
      sesionesActivas: record._count.sesiones,
    };
  }

  async findOpciones(roles: RolUsuario[]): Promise<UsuarioOpcion[]> {
    const records = await this.prisma.usuario.findMany({
      where: {
        activo: true,
        eliminadoEn: null,
        ...(roles.length && {
          rol: {
            in: roles.map((rol) => UsuarioPrismaMapper.rolPersistido(rol)),
          },
        }),
      },
      select: { id: true, nombre: true, rol: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });

    return records.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      rol: UsuarioPrismaMapper.rolDeDominio(r.rol),
    }));
  }

  async findCredenciales(correo: string): Promise<CredencialesUsuario | null> {
    const record = await this.prisma.usuario.findFirst({
      where: { correo, eliminadoEn: null },
      select: { id: true, activo: true, contrasena: true },
    });

    return record
      ? {
          usuarioId: record.id,
          activo: record.activo,
          contrasenaHash: record.contrasena,
        }
      : null;
  }

  async findPerfilSesion(id: number): Promise<PerfilSesion | null> {
    const record = await this.prisma.usuario.findFirst({
      where: { id, eliminadoEn: null },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        empresaId: true,
        perfil: { select: { avatarUrl: true, portadaUrl: true } },
      },
    });

    return record
      ? {
          id: record.id,
          nombre: record.nombre,
          correo: record.correo,
          rol: UsuarioPrismaMapper.rolDeDominio(record.rol),
          activo: record.activo,
          empresaId: record.empresaId,
          avatarUrl: record.perfil?.avatarUrl ?? null,
          portadaUrl: record.perfil?.portadaUrl ?? null,
        }
      : null;
  }

  private construirWhere(filtros: UsuarioFiltros): Prisma.UsuarioWhereInput {
    const estados = filtros.estados?.length
      ? filtros.estados
      : [EstadoUsuario.ACTIVO, EstadoUsuario.INACTIVO];
    const { search } = filtros;

    return {
      AND: [
        { OR: estados.map((estado) => POR_ESTADO[estado]) },
        ...(filtros.roles?.length
          ? [
              {
                rol: {
                  in: filtros.roles.map((rol) =>
                    UsuarioPrismaMapper.rolPersistido(rol),
                  ),
                },
              },
            ]
          : []),
        ...(search
          ? [
              {
                OR: [
                  { nombre: { contains: search, mode: 'insensitive' } },
                  { correo: { contains: search, mode: 'insensitive' } },
                  {
                    correoEliminado: { contains: search, mode: 'insensitive' },
                  },
                  { telefono: { contains: search, mode: 'insensitive' } },
                ] satisfies Prisma.UsuarioWhereInput[],
              },
            ]
          : []),
      ],
    };
  }
}
