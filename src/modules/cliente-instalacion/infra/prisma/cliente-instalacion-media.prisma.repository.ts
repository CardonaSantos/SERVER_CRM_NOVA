import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInstalacionMediaEntity } from '../../domain/entities/cliente-instalacion-media.entity';
import {
  ClienteInstalacionMediaRepositoryPort,
  ClienteInstalacionMediaWithMedia,
} from '../../domain/ports/cliente-instalacion-media.repository.port';
import { ClienteInstalacionMediaPrismaMapper } from './cliente-instalacion-media.prisma.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClienteInstalacionMediaPrismaRepository
  implements ClienteInstalacionMediaRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteInstalacionMediaEntity,
  ): Promise<ClienteInstalacionMediaEntity> {
    const record = await this.prisma.clienteInstalacionMedia.create({
      data: ClienteInstalacionMediaPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteInstalacionMediaPrismaMapper.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    const record = await this.prisma.clienteInstalacionMedia.findUnique({
      where: {
        id,
      },
    });

    if (!record) throw new Error('Registro no encontrado');

    return;
  }

  async findByInstalacion(
    instalacionId: number,
  ): Promise<Array<ClienteInstalacionMediaWithMedia>> {
    const records = await this.prisma.clienteInstalacionMedia.findMany({
      where: {
        instalacionId,
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
      evidencia: ClienteInstalacionMediaPrismaMapper.toDomain(record),

      media: record.media
        ? {
            id: record.media.id,
            cndUrl: record.media.cdnUrl,
            extension: record.media.extension,
            key: record.media.key,
            mimeType: record.media.mimeType,
            tamanioBytes: record.media.tamanioBytes,
          }
        : undefined,
    }));
  }
}
