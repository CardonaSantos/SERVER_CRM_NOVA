import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import {
  ClienteDesInstalacionFindManyFilters,
  ClienteDesInstalacionPaginatedResult,
  ClienteDesInstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion.repository.port';
import { ClienteDesinstalacionPrismaMapper } from './cliente-desinstalacion.prisma.mapper';

@Injectable()
export class ClienteDesInstalacionPrismaRepository
  implements ClienteDesInstalacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    const record = await this.prisma.clienteDesinstalacion.create({
      data: ClienteDesinstalacionPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteDesinstalacionPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<ClienteDesinstalacionEntity | null> {
    const record = await this.prisma.clienteDesinstalacion.findUnique({
      where: {
        id,
      },
    });

    if (!record) return null;

    return ClienteDesinstalacionPrismaMapper.toDomain(record);
  }

  async findMany(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Promise<ClienteDesInstalacionPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ClienteDesinstalacionWhereInput = {};

    if (filters.empresaId) {
      where.empresaId = filters.empresaId;
    }

    if (filters.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.creadoPorId) {
      where.creadoPorId = filters.creadoPorId;
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
          direccionServicio: {
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
          resultado: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteDesinstalacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          creadoEn: 'desc',
        },
      }),
      this.prisma.clienteDesinstalacion.count({
        where,
      }),
    ]);

    return {
      items: records.map(ClienteDesinstalacionPrismaMapper.toDomain),
      total,
      page,
      limit,
    };
  }

  async save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    const props = entity.toPrimitives();

    if (!props.id) {
      throw new Error('No se puede guardar una desinstalación sin id.');
    }

    const saved = await this.prisma.clienteDesinstalacion.update({
      where: {
        id: props.id,
      },
      data: ClienteDesinstalacionPrismaMapper.toUpdatePersistence(entity),
    });

    return ClienteDesinstalacionPrismaMapper.toDomain(saved);
  }
}
