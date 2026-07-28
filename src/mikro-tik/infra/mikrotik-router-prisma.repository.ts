import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { MikrotikRouterRepositoryPort } from '../domain/ports/mikrotik-router-repository.port';
import { MikrotikRouterEntity } from '../domain/entities/mikrotik-router-entity';
import { MikrotikRouterPrismaMapper } from './prisma/miktotik-router-prisma.mapper';

@Injectable()
export class MikrotikRouterPrismaRepository
  implements MikrotikRouterRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: MikrotikRouterEntity): Promise<MikrotikRouterEntity> {
    const data = MikrotikRouterPrismaMapper.toCreatePersistence(entity);

    const record = await this.prisma.mikrotikRouter.create({
      data,
    });

    return MikrotikRouterPrismaMapper.toDomain(record);
  }

  async update(entity: MikrotikRouterEntity): Promise<MikrotikRouterEntity> {
    if (entity.id === null) {
      throw new Error('No puede actualizarse un router MikroTik sin id.');
    }

    const data = MikrotikRouterPrismaMapper.toUpdatePersistence(entity);

    const record = await this.prisma.mikrotikRouter.update({
      where: {
        id: entity.id,
      },

      data,
    });

    return MikrotikRouterPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<MikrotikRouterEntity | null> {
    const record = await this.prisma.mikrotikRouter.findUnique({
      where: {
        id,
      },
    });

    return record ? MikrotikRouterPrismaMapper.toDomain(record) : null;
  }

  async findByName(params: {
    empresaId: number;
    nombre: string;
  }): Promise<MikrotikRouterEntity | null> {
    const record = await this.prisma.mikrotikRouter.findUnique({
      where: {
        empresaId_nombre: {
          empresaId: params.empresaId,

          nombre: params.nombre.trim(),
        },
      },
    });

    return record ? MikrotikRouterPrismaMapper.toDomain(record) : null;
  }

  async findAll(): Promise<MikrotikRouterEntity[]> {
    const records = await this.prisma.mikrotikRouter.findMany({
      orderBy: [
        {
          activo: 'desc',
        },
        {
          nombre: 'asc',
        },
      ],
    });

    return records.map((record) => MikrotikRouterPrismaMapper.toDomain(record));
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.mikrotikRouter.deleteMany({
      where: {
        id,
      },
    });

    return result.count > 0;
  }
}
