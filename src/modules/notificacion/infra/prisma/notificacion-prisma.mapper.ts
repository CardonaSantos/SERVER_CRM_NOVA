import {
  AudienciaNotificacion as AudienciaPrisma,
  CategoriaNotificacion as CategoriaPrisma,
  Notificacion as NotificacionRecord,
  Prisma,
  SeveridadNotificacion as SeveridadPrisma,
} from '@prisma/client';

import { NotificacionEntity } from '../../domain/entities/notificacion.entity';
import { AudienciaNotificacion } from '../../domain/enums/audiencia-notificacion.enum';
import { CategoriaNotificacion } from '../../domain/enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../../domain/enums/severidad-notificacion.enum';
import { ReferenciaNotificacion } from '../../domain/props/notificacion.props';

const AUDIENCIA_A_PRISMA: Record<AudienciaNotificacion, AudienciaPrisma> = {
  [AudienciaNotificacion.USUARIOS]: AudienciaPrisma.USUARIOS,
  [AudienciaNotificacion.ROL]: AudienciaPrisma.ROL,
  // Una empresa por base de datos: "todos" se guarda como GLOBAL.
  [AudienciaNotificacion.TODOS]: AudienciaPrisma.GLOBAL,
};

export class NotificacionPrismaMapper {
  static categoria(valor: CategoriaPrisma): CategoriaNotificacion {
    return CategoriaNotificacion[valor];
  }

  static severidad(valor: SeveridadPrisma): SeveridadNotificacion {
    return SeveridadNotificacion[valor];
  }

  static categoriaAPrisma(valor: CategoriaNotificacion): CategoriaPrisma {
    return CategoriaPrisma[valor];
  }

  static severidadAPrisma(valor: SeveridadNotificacion): SeveridadPrisma {
    return SeveridadPrisma[valor];
  }

  static referencia(r: {
    referenciaTipo: string | null;
    referenciaId: number | null;
  }): ReferenciaNotificacion | null {
    return r.referenciaTipo && r.referenciaId
      ? { tipo: r.referenciaTipo, id: r.referenciaId }
      : null;
  }

  static toDomain(record: NotificacionRecord): NotificacionEntity {
    return NotificacionEntity.hydrate({
      id: record.id,
      titulo: record.titulo,
      mensaje: record.mensaje,
      categoria: NotificacionPrismaMapper.categoria(record.categoria),
      severidad: NotificacionPrismaMapper.severidad(record.severidad),
      subtipo: record.subtipo,
      referencia: NotificacionPrismaMapper.referencia(record),
      ruta: record.route,
      etiquetaAccion: record.actionLabel,
      audiencia:
        record.audiencia === AudienciaPrisma.USUARIOS
          ? AudienciaNotificacion.USUARIOS
          : record.audiencia === AudienciaPrisma.ROL
            ? AudienciaNotificacion.ROL
            : AudienciaNotificacion.TODOS,
      remitenteId: record.remitenteId,
      creadaEn: new Date(record.fechaCreacion),
    });
  }

  static toCreatePersistence(
    entity: NotificacionEntity,
  ): Prisma.NotificacionUncheckedCreateInput {
    const p = entity.toPrimitives();

    return {
      titulo: p.titulo,
      mensaje: p.mensaje,
      categoria: NotificacionPrismaMapper.categoriaAPrisma(p.categoria),
      severidad: NotificacionPrismaMapper.severidadAPrisma(p.severidad),
      subtipo: p.subtipo,
      referenciaTipo: p.referencia?.tipo ?? null,
      referenciaId: p.referencia?.id ?? null,
      route: p.ruta,
      actionLabel: p.etiquetaAccion,
      audiencia: AUDIENCIA_A_PRISMA[p.audiencia],
      remitenteId: p.remitenteId,
      fechaCreacion: p.creadaEn,
    };
  }
}
