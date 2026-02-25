import { PerfilUsuario as PrismaPerfil } from '@prisma/client';
import { Perfil } from '../entities/perfil.entity';
import { PerfilMedia } from '../entities/perfil.entity';

export class PrismaPerfilUsuarioMapper {
  static toDomain(raw: PrismaPerfil): Perfil {
    const avatar =
      raw.avatarUrl && raw.avatarKey && raw.avatarBucket
        ? PerfilMedia.crear({
            url: raw.avatarUrl,
            key: raw.avatarKey,
            bucket: raw.avatarBucket,
            mimeType: raw.avatarMimeType ?? '',
            size: raw.avatarSize ?? 0,
          })
        : undefined;

    const portada =
      raw.portadaUrl && raw.portadaKey && raw.portadaBucket
        ? PerfilMedia.crear({
            url: raw.portadaUrl,
            key: raw.portadaKey,
            bucket: raw.portadaBucket,
            mimeType: raw.portadaMimeType ?? '',
            size: raw.portadaSize ?? 0,
          })
        : undefined;

    return Perfil.crear({
      id: raw.id,
      usuarioId: raw.usuarioId,
      avatar,
      portada,
      bio: raw.bio ?? undefined,
      telefono: raw.telefono ?? undefined,
      notificarWhatsApp: raw.notificarWhatsApp,
      notificarPush: raw.notificarPush,
      notificarSonido: raw.notificarSonido,
      creadoEn: raw.creadoEn,
      actualizadoEn: raw.actualizadoEn,
    });
  }

  static toPersistence(entity: Perfil) {
    const data = entity.toJSON();

    return {
      usuarioId: data.usuarioId,

      avatarUrl: data.avatar?.url ?? null,
      avatarKey: data.avatar?.key ?? null,
      avatarBucket: data.avatar?.bucket ?? null,
      avatarMimeType: data.avatar?.mimeType ?? null,
      avatarSize: data.avatar?.size ?? null,

      portadaUrl: data.portada?.url ?? null,
      portadaKey: data.portada?.key ?? null,
      portadaBucket: data.portada?.bucket ?? null,
      portadaMimeType: data.portada?.mimeType ?? null,
      portadaSize: data.portada?.size ?? null,

      bio: data.bio ?? null,
      telefono: data.telefono ?? null,
      notificarWhatsApp: data.notificarWhatsApp,
      notificarPush: data.notificarPush,
      notificarSonido: data.notificarSonido,
    };
  }

  static toUpdate(entity: Perfil) {
    const data = entity.toJSON();

    return {
      avatarUrl: data.avatar?.url ?? null,
      avatarKey: data.avatar?.key ?? null,
      avatarBucket: data.avatar?.bucket ?? null,
      avatarMimeType: data.avatar?.mimeType ?? null,
      avatarSize: data.avatar?.size ?? null,

      portadaUrl: data.portada?.url ?? null,
      portadaKey: data.portada?.key ?? null,
      portadaBucket: data.portada?.bucket ?? null,
      portadaMimeType: data.portada?.mimeType ?? null,
      portadaSize: data.portada?.size ?? null,

      bio: data.bio ?? null,
      telefono: data.telefono ?? null,
      notificarWhatsApp: data.notificarWhatsApp,
      notificarPush: data.notificarPush,
      notificarSonido: data.notificarSonido,
    };
  }
}
