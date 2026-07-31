import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteDesinstalacionMediaEntity } from '../../domain/entities/cliente-desinstalacion-media.entity';

import {
  ClienteDesinstalacionMediaRepositoryPort,
  ClienteDesinstalacionMediaWithMedia,
} from '../../domain/ports/cliente-desinstalacion-media.repository.port';

import { ClienteDesinstalacionMediaPrismaMapper } from './cliente-desinstalacion-media.prisma.mapper';

@Injectable()
export class ClienteDesinstalacionMediaPrismaRepository
  implements ClienteDesinstalacionMediaRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteDesinstalacionMediaEntity,
  ): Promise<ClienteDesinstalacionMediaEntity> {
    const record = await this.prisma.clienteDesinstalacionMedia.create({
      data: ClienteDesinstalacionMediaPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteDesinstalacionMediaPrismaMapper.toDomain(record);
  }

  async findByDesinstalacion(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionMediaWithMedia[]> {
    const records = await this.prisma.clienteDesinstalacionMedia.findMany({
      where: {
        desinstalacionId,
      },

      include: {
        media: {
          select: {
            id: true,

            cdnUrl: true,

            key: true,

            mimeType: true,

            extension: true,

            tamanioBytes: true,
          },
        },
      },

      orderBy: [
        {
          orden: 'asc',
        },
        {
          creadoEn: 'asc',
        },
      ],
    });

    return records.map((record) => ({
      evidencia: ClienteDesinstalacionMediaPrismaMapper.toDomain(record),

      media: record.media
        ? {
            id: record.media.id,

            cdnUrl: record.media.cdnUrl,

            key: record.media.key,

            mimeType: record.media.mimeType,

            extension: record.media.extension,

            tamanioBytes: record.media.tamanioBytes,
          }
        : undefined,
    }));
  }

  async delete(id: number): Promise<void> {
    const record = await this.prisma.clienteDesinstalacionMedia.findUnique({
      where: {
        id,
      },
    });

    if (!record) {
      throw new NotFoundException(
        'La evidencia de desinstalación no fue encontrada.',
      );
    }

    await this.prisma.clienteDesinstalacionMedia.delete({
      where: {
        id,
      },
    });
  }
}
