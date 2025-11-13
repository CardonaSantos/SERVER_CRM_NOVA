// src/modules/media/infra/persistence/prisma-media.repository.ts
import { PrismaService } from 'src/prisma/prisma.service';
import { MediaAsset } from '../../domain/file-aset';
import {
  MediaRepositoryPort,
  ListarMediaFiltro,
} from '../../domain/ports/media-repository.port';
import { MediaMapper } from './media.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaMediaRepository implements MediaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(asset: MediaAsset): Promise<MediaAsset> {
    const data = MediaMapper.toCreateData(asset);
    const row = await this.prisma.media.create({ data });
    return MediaMapper.toDomain(row);
  }

  async buscarPorId(id: number, empresaId: number): Promise<MediaAsset | null> {
    const row = await this.prisma.media.findFirst({ where: { id, empresaId } });
    return row ? MediaMapper.toDomain(row) : null;
  }

  async listar(f: ListarMediaFiltro): Promise<MediaAsset[]> {
    const rows = await this.prisma.media.findMany({
      where: {
        empresaId: f.empresaId,
        clienteId: f.clienteId ?? undefined,
        albumId: f.albumId ?? undefined,
        tipo: (f.tipo as any) ?? undefined,
      },
      orderBy: { creadoEn: 'desc' },
      skip: f.skip ?? 0,
      take: f.take ?? 20,
    });
    return rows.map(MediaMapper.toDomain);
  }

  async marcarEliminado(
    id: number,
    empresaId: number,
    fecha: Date,
  ): Promise<void> {
    await this.prisma.media.update({
      where: { id },
      data: { estado: 'ELIMINADO' as any, eliminadoEn: fecha },
    });
  }

  async existePorBucketKey(bucket: string, key: string): Promise<boolean> {
    const found = await this.prisma.media.findUnique({
      where: { bucket_key: { bucket, key } } as any,
    });
    return !!found;
  }
}
