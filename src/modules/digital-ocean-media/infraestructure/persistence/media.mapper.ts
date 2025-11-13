// src/modules/media/infra/persistence/media.mapper.ts
import { Media, Prisma } from '@prisma/client';
import { MediaAsset } from '../../domain/file-aset';

export const MediaMapper = {
  toDomain(row: Media): MediaAsset {
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
      metadatos: (row.metadatos as any) ?? undefined,
      categoria: row.categoria as any,
      tipo: row.tipo as any,
      publico: row.publico,
      estado: row.estado as any,
      titulo: row.titulo ?? undefined,
      descripcion: row.descripcion ?? undefined,
      etiqueta: row.etiqueta ?? undefined,
      orden: row.orden ?? 0,
      tomadoEn: row.tomadoEn ?? undefined,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
      eliminadoEn: row.eliminadoEn ?? undefined,
    };
  },

  toCreateData(asset: MediaAsset): Prisma.MediaUncheckedCreateInput {
    return {
      // FKs crudos (unchecked)
      empresaId: asset.empresaId,
      clienteId: asset.clienteId ?? null,
      albumId: asset.albumId ?? null,
      subidoPorId: asset.subidoPorId ?? null,

      // Enums (castea a enum de Prisma si tus tipos de dominio difieren)
      categoria: asset.categoria as any,
      tipo: asset.tipo as any,
      estado: asset.estado as any,

      // Storage
      bucket: asset.bucket ?? null,
      region: asset.region ?? null,
      key: asset.key,
      cdnUrl: asset.cdnUrl ?? null,

      // Metadatos
      mimeType: asset.mimeType ?? null,
      extension: asset.extension ?? null,
      tamanioBytes:
        asset.tamanioBytes !== undefined ? BigInt(asset.tamanioBytes) : null,
      ancho: asset.ancho ?? null,
      alto: asset.alto ?? null,
      duracionSeg: asset.duracionSeg ?? null,
      checksumSha256: asset.checksumSha256 ?? null,

      // Campos de negocio/organización
      titulo: asset.titulo ?? null,
      descripcion: asset.descripcion ?? null,
      etiqueta: asset.etiqueta ?? null,
      orden: asset.orden ?? 0,
      tomadoEn: asset.tomadoEn ?? null,
      publico: asset.publico,

      // JSON: ¡IMPORTANTE! Tipar como InputJsonValue u omitir si no hay valor
      ...(asset.metadatos !== undefined
        ? { metadatos: asset.metadatos as unknown as Prisma.InputJsonValue }
        : {}),

      // Auditoría
      eliminadoEn: asset.eliminadoEn ?? null,
      // creadoEn/actualizadoEn los deja Prisma (defaults/updatedAt)
    };
  },
};
