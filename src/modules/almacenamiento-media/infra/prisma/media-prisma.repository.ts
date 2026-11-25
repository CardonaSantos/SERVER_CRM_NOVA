import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { MediaRepositoryPort } from '../../domain/ports/media-repository.port';
import { MediaAsset } from '../../domain/props/media-asset.props';
import { MediaPrismaMapper } from './media-prisma.mapper';

@Injectable()
export class MediaPrismaRepository implements MediaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(asset: MediaAsset): Promise<MediaAsset> {
    const row = await this.prisma.media.create({
      data: MediaPrismaMapper.toCreateData(asset),
    });

    return MediaPrismaMapper.toDomain(row);
  }

  async buscarPorId(id: number, empresaId: number): Promise<MediaAsset | null> {
    const row = await this.prisma.media.findFirst({ where: { id, empresaId } });

    return row ? MediaPrismaMapper.toDomain(row) : null;
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.media.delete({ where: { id } });
  }
}
