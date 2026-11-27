import { Prisma, PerfilUsuario as PerfilUsuarioRecord } from '@prisma/client';
import { PerfilUsuarioEntity } from '../../domain/entities/perfil-usuario.entity';
import { ImagenPerfil } from '../../domain/props/perfil-usuario.props';

type Columnas = {
  url: string | null;
  key: string | null;
  bucket: string | null;
  mimeType: string | null;
  size: number | null;
};

function imagenDe(c: Columnas): ImagenPerfil | null {
  // Sin llave ni bucket no se puede borrar: se trata como si no hubiera.
  if (!c.url || !c.key || !c.bucket) return null;

  return {
    url: c.url,
    key: c.key,
    bucket: c.bucket,
    mimeType: c.mimeType ?? '',
    size: c.size ?? 0,
  };
}

export class PerfilUsuarioPrismaMapper {
  static toDomain(r: PerfilUsuarioRecord): PerfilUsuarioEntity {
    return PerfilUsuarioEntity.hydrate({
      id: r.id,
      usuarioId: r.usuarioId,
      bio: r.bio ?? null,
      avatar: imagenDe({
        url: r.avatarUrl,
        key: r.avatarKey,
        bucket: r.avatarBucket,
        mimeType: r.avatarMimeType,
        size: r.avatarSize,
      }),
      portada: imagenDe({
        url: r.portadaUrl,
        key: r.portadaKey,
        bucket: r.portadaBucket,
        mimeType: r.portadaMimeType,
        size: r.portadaSize,
      }),
      notificarWhatsApp: r.notificarWhatsApp,
      notificarPush: r.notificarPush,
      notificarSonido: r.notificarSonido,
      creadoEn: new Date(r.creadoEn),
      actualizadoEn: new Date(r.actualizadoEn),
    });
  }

  /** Sin `telefono`: el del usuario es el único que se escribe. */
  static toUpdatePersistence(
    entity: PerfilUsuarioEntity,
  ): Prisma.PerfilUsuarioUncheckedUpdateInput {
    const p = entity.toPrimitives();

    return {
      bio: p.bio,
      avatarUrl: p.avatar?.url ?? null,
      avatarKey: p.avatar?.key ?? null,
      avatarBucket: p.avatar?.bucket ?? null,
      avatarMimeType: p.avatar?.mimeType ?? null,
      avatarSize: p.avatar?.size ?? null,
      portadaUrl: p.portada?.url ?? null,
      portadaKey: p.portada?.key ?? null,
      portadaBucket: p.portada?.bucket ?? null,
      portadaMimeType: p.portada?.mimeType ?? null,
      portadaSize: p.portada?.size ?? null,
      notificarWhatsApp: p.notificarWhatsApp,
      notificarPush: p.notificarPush,
      notificarSonido: p.notificarSonido,
    };
  }

  static toCreatePersistence(
    entity: PerfilUsuarioEntity,
  ): Prisma.PerfilUsuarioUncheckedCreateInput {
    return {
      ...(PerfilUsuarioPrismaMapper.toUpdatePersistence(
        entity,
      ) as Prisma.PerfilUsuarioUncheckedCreateInput),
      usuarioId: entity.usuarioId,
    };
  }
}
