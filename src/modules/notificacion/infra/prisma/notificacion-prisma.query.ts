import { Injectable } from '@nestjs/common';
import { Prisma, RolUsuario } from '@prisma/client';

import {
  aDesplazamiento,
  crearResultadoPaginado,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { rangoDiasNegocio } from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  DestinoUsuarios,
  NotificacionQueryPort,
} from '../../domain/ports/notificacion-query.port';
import {
  ContadoresNotificacion,
  NotificacionBandejaFiltros,
  NotificacionBandejaItem,
} from '../../domain/read-models/notificacion-bandeja.read-model';
import { NotificacionPrismaMapper } from './notificacion-prisma.mapper';

const SELECT_BANDEJA = {
  leido: true,
  leidoEn: true,
  notificacion: {
    select: {
      id: true,
      titulo: true,
      mensaje: true,
      categoria: true,
      severidad: true,
      referenciaTipo: true,
      referenciaId: true,
      route: true,
      actionLabel: true,
      fechaCreacion: true,
    },
  },
} satisfies Prisma.NotificacionUsuarioSelect;

const ROLES = new Set<string>(Object.values(RolUsuario));

@Injectable()
export class NotificacionPrismaQuery implements NotificacionQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findBandeja(
    usuarioId: number,
    filtros: NotificacionBandejaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<NotificacionBandejaItem>> {
    const where = this.construirWhere(usuarioId, filtros);
    const dir = filtros.sortDir ?? 'desc';

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.notificacionUsuario.findMany({
        where,
        select: SELECT_BANDEJA,
        orderBy: [
          { notificacion: { fechaCreacion: dir } },
          { notificacionId: dir },
        ],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.notificacionUsuario.count({ where }),
    ]);

    const items = filas.map(({ notificacion: n, leido, leidoEn }) => ({
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      categoria: NotificacionPrismaMapper.categoria(n.categoria),
      severidad: NotificacionPrismaMapper.severidad(n.severidad),
      referencia: NotificacionPrismaMapper.referencia(n),
      ruta: n.route,
      etiquetaAccion: n.actionLabel,
      creadaEn: n.fechaCreacion,
      // Filas leídas antes de guardar la fecha: leídas, sin fecha conocida.
      leidaEn: leido ? (leidoEn ?? n.fechaCreacion) : null,
    }));

    return crearResultadoPaginado(items, total, paginacion);
  }

  async contar(usuarioId: number): Promise<ContadoresNotificacion> {
    const noLeidas = await this.prisma.notificacionUsuario.count({
      where: { usuarioId, eliminado: false, leido: false },
    });

    return { noLeidas };
  }

  async resolverDestinatarios(destino: DestinoUsuarios): Promise<number[]> {
    const ids = (destino.usuarioIds ?? []).filter(
      (id) => Number.isInteger(id) && id > 0,
    );
    const roles = (destino.roles ?? []).filter((rol) =>
      ROLES.has(rol),
    ) as RolUsuario[];

    if (!destino.todos && ids.length === 0 && roles.length === 0) return [];

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        activo: true,
        ...(!destino.todos && {
          OR: [
            ...(ids.length ? [{ id: { in: ids } }] : []),
            ...(roles.length ? [{ rol: { in: roles } }] : []),
          ],
        }),
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    return usuarios.map((u) => u.id);
  }

  private construirWhere(
    usuarioId: number,
    f: NotificacionBandejaFiltros,
  ): Prisma.NotificacionUsuarioWhereInput {
    const notificacion: Prisma.NotificacionWhereInput = {
      ...(f.categorias?.length && {
        categoria: {
          in: f.categorias.map(NotificacionPrismaMapper.categoriaAPrisma),
        },
      }),
      ...(f.severidades?.length && {
        severidad: {
          in: f.severidades.map(NotificacionPrismaMapper.severidadAPrisma),
        },
      }),
      ...((f.desde || f.hasta) && {
        fechaCreacion: rangoDiasNegocio(f.desde, f.hasta),
      }),
      ...(f.search && {
        OR: [
          { titulo: { contains: f.search, mode: 'insensitive' } },
          { mensaje: { contains: f.search, mode: 'insensitive' } },
        ],
      }),
    };

    return {
      usuarioId,
      eliminado: false,
      ...(f.soloNoLeidas && { leido: false }),
      notificacion,
    };
  }
}
