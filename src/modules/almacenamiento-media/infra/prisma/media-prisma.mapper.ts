import {
  CategoriaMedia as CategoriaMediaPrisma,
  EstadoMedia as EstadoMediaPrisma,
  Media,
  Prisma,
  TipoMedia as TipoMediaPrisma,
} from '@prisma/client';

import {
  CategoriaMedia,
  EstadoMedia,
  TipoMedia,
} from '../../domain/enums/media.enum';
import { MediaAsset } from '../../domain/props/media-asset.props';

/** Único lugar donde se traducen filas de Prisma ↔ MediaAsset. */
export class MediaPrismaMapper {
  static toDomain(row: Media): MediaAsset {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId ?? undefined,
      albumId: row.albumId ?? undefined,
      subidoPorId: row.subidoPorId ?? undefined,
      provider: 'do-spaces',
      bucket: row.bucket ?? undefined,
      region: row.region ?? undefined,
      key: row.key,
      cdnUrl: row.cdnUrl ?? undefined,
      mimeType: row.mimeType ?? undefined,
      extension: row.extension ?? undefined,
      tamanioBytes: row.tamanioBytes ? Number(row.tamanioBytes) : undefined,
      ancho: row.ancho ?? undefined,
      alto: row.alto ?? undefined,
      duracionSeg: row.duracionSeg ?? undefined,
      checksumSha256: row.checksumSha256 ?? undefined,
      metadatos: (row.metadatos as Record<string, unknown> | null) ?? undefined,
      categoria: row.categoria as CategoriaMedia,
      tipo: row.tipo as TipoMedia,
      publico: row.publico,
      estado: row.estado as EstadoMedia,
      titulo: row.titulo ?? undefined,
      descripcion: row.descripcion ?? undefined,
      etiqueta: row.etiqueta ?? undefined,
      orden: row.orden ?? 0,
      tomadoEn: row.tomadoEn ?? undefined,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
      eliminadoEn: row.eliminadoEn ?? undefined,
    };
  }

  static toCreateData(asset: MediaAsset): Prisma.MediaUncheckedCreateInput {
    return {
      empresaId: asset.empresaId,
      clienteId: asset.clienteId ?? null,
      albumId: asset.albumId ?? null,
      subidoPorId: asset.subidoPorId ?? null,

      // Sin categoría, la BD aplica su valor por defecto (CLIENTE_GENERAL).
      ...(asset.categoria
        ? { categoria: asset.categoria as CategoriaMediaPrisma }
        : {}),
      tipo: asset.tipo as TipoMediaPrisma,
      estado: asset.estado as EstadoMediaPrisma,

      bucket: asset.bucket ?? null,
      region: asset.region ?? null,
      key: asset.key,
      cdnUrl: asset.cdnUrl ?? null,

      mimeType: asset.mimeType ?? null,
      extension: asset.extension ?? null,
      tamanioBytes:
        asset.tamanioBytes !== undefined ? BigInt(asset.tamanioBytes) : null,
      ancho: asset.ancho ?? null,
      alto: asset.alto ?? null,
      duracionSeg: asset.duracionSeg ?? null,
      checksumSha256: asset.checksumSha256 ?? null,

      titulo: asset.titulo ?? null,
      descripcion: asset.descripcion ?? null,
      etiqueta: asset.etiqueta ?? null,
      orden: asset.orden ?? 0,
      tomadoEn: asset.tomadoEn ?? null,
      publico: asset.publico,

      ...(asset.metadatos !== undefined
        ? { metadatos: asset.metadatos as unknown as Prisma.InputJsonValue }
        : {}),

      eliminadoEn: asset.eliminadoEn ?? null,
      // creadoEn/actualizadoEn: defaults de Prisma
    };
  }
}
