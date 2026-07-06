import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import {
  ClienteInstalacionFindManyFilters,
  ClienteInstalacionPaginatedResult,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion.repository.port';
import { ClienteInstalacionPrismaMapper } from './cliente-instalacion.prisma.mapper';

@Injectable()
export class ClienteInstalacionPrismaRepository
  implements ClienteInstalacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteInstalacionEntity,
  ): Promise<ClienteInstalacionEntity> {
    const data = ClienteInstalacionPrismaMapper.toCreatePersistence(entity);

    const record = await this.prisma.clienteInstalacion.create({
      data,
    });

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }

  async findById(params: {
    id: number;
  }): Promise<ClienteInstalacionEntity | null> {
    const record = await this.prisma.clienteInstalacion.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!record) return null;

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }

  async findMany(
    filters: ClienteInstalacionFindManyFilters,
  ): Promise<ClienteInstalacionPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ClienteInstalacionWhereInput = {
      empresaId: filters.empresaId,
    };

    if (filters.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.asesorId) {
      where.asesorId = filters.asesorId;
    }

    if (filters.creadoPorId) {
      where.creadoPorId = filters.creadoPorId;
    }

    if (filters.completadoPorId) {
      where.completadoPorId = filters.completadoPorId;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.fechaProgramadaDesde || filters.fechaProgramadaHasta) {
      where.fechaProgramada = {
        ...(filters.fechaProgramadaDesde
          ? { gte: filters.fechaProgramadaDesde }
          : {}),
        ...(filters.fechaProgramadaHasta
          ? { lte: filters.fechaProgramadaHasta }
          : {}),
      };
    }

    if (filters.fechaFinalizacionDesde || filters.fechaFinalizacionHasta) {
      where.fechaFinalizacion = {
        ...(filters.fechaFinalizacionDesde
          ? { gte: filters.fechaFinalizacionDesde }
          : {}),
        ...(filters.fechaFinalizacionHasta
          ? { lte: filters.fechaFinalizacionHasta }
          : {}),
      };
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();

      where.OR = [
        {
          direccionInstalacion: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          referenciaUbicacion: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          observaciones: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          motivo: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          resultado: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteInstalacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          creadoEn: 'desc',
        },
      }),
      this.prisma.clienteInstalacion.count({
        where,
      }),
    ]);

    return {
      items: records.map(ClienteInstalacionPrismaMapper.toDomain),
      total,
      page,
      limit,
    };
  }

  async save(
    entity: ClienteInstalacionEntity,
  ): Promise<ClienteInstalacionEntity> {
    const props = entity.toPrimitives();

    if (!props.id) {
      throw new Error('No se puede guardar una instalación sin id.');
    }

    const data = ClienteInstalacionPrismaMapper.toUpdatePersistence(entity);

    const record = await this.prisma.clienteInstalacion.update({
      where: {
        id: props.id,
      },
      data,
    });

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }
}
