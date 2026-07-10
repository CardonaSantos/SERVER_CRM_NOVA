import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';

import {
  ClienteDesinstalacionDetalle,
  ClienteDesInstalacionFindManyFilters,
  ClienteDesInstalacionPaginatedResult,
  ClienteDesInstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion.repository.port';

import { ClienteDesinstalacionPrismaMapper } from './cliente-desinstalacion.prisma.mapper';
import { ClienteDesinstalacionTecnicoPrismaMapper } from './cliente-desinstalacion-tecnico.prisma.mapper';

@Injectable()
export class ClienteDesInstalacionPrismaRepository
  implements ClienteDesInstalacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    const record = await this.prisma.clienteDesinstalacion.create({
      data: ClienteDesinstalacionPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteDesinstalacionPrismaMapper.toDomain(record);
  }

  // =========================================================
  // FIND SIMPLE
  // =========================================================

  async findById(id: number): Promise<ClienteDesinstalacionEntity | null> {
    const record = await this.prisma.clienteDesinstalacion.findUnique({
      where: {
        id,
      },
    });

    if (!record) return null;

    return ClienteDesinstalacionPrismaMapper.toDomain(record);
  }

  // =========================================================
  // FIND DETAIL
  // =========================================================

  async findDetalleById(
    id: number,
  ): Promise<ClienteDesinstalacionDetalle | null> {
    const record = await this.prisma.clienteDesinstalacion.findUnique({
      where: {
        id,
      },
      include: {
        tecnicos: {
          orderBy: [
            {
              esResponsable: 'desc',
            },
            {
              creadoEn: 'asc',
            },
          ],
        },
      },
    });

    if (!record) return null;

    return {
      desinstalacion: ClienteDesinstalacionPrismaMapper.toDomain(record),

      tecnicos: record.tecnicos.map((tecnico) =>
        ClienteDesinstalacionTecnicoPrismaMapper.toDomain(tecnico),
      ),
    };
  }

  // =========================================================
  // FIND MANY WITH DETAILS
  // =========================================================

  async findMany(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Promise<ClienteDesInstalacionPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const where = this.buildWhere(filters);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteDesinstalacion.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          creadoEn: 'desc',
        },

        include: {
          tecnicos: {
            orderBy: [
              {
                esResponsable: 'desc',
              },
              {
                creadoEn: 'asc',
              },
            ],
          },
        },
      }),

      this.prisma.clienteDesinstalacion.count({
        where,
      }),
    ]);

    return {
      items: records.map((record) => ({
        desinstalacion: ClienteDesinstalacionPrismaMapper.toDomain(record),

        tecnicos: record.tecnicos.map((tecnico) =>
          ClienteDesinstalacionTecnicoPrismaMapper.toDomain(tecnico),
        ),
      })),

      total,
      page,
      limit,
    };
  }

  // =========================================================
  // SAVE
  // =========================================================

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

  // =========================================================
  // PRIVATE HELPERS
  // =========================================================

  private buildWhere(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Prisma.ClienteDesinstalacionWhereInput {
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

    if (filters.solicitadoPorId) {
      where.solicitadoPorId = filters.solicitadoPorId;
    }

    if (filters.ejecutadoPorId) {
      where.ejecutadoPorId = filters.ejecutadoPorId;
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

    if (filters.motivo) {
      where.motivo = filters.motivo;
    }

    if (filters.fechaProgramadaDesde || filters.fechaProgramadaHasta) {
      where.fechaProgramada = {
        ...(filters.fechaProgramadaDesde
          ? {
              gte: filters.fechaProgramadaDesde,
            }
          : {}),

        ...(filters.fechaProgramadaHasta
          ? {
              lte: filters.fechaProgramadaHasta,
            }
          : {}),
      };
    }

    if (filters.fechaFinalizacionDesde || filters.fechaFinalizacionHasta) {
      where.fechaFinalizacion = {
        ...(filters.fechaFinalizacionDesde
          ? {
              gte: filters.fechaFinalizacionDesde,
            }
          : {}),

        ...(filters.fechaFinalizacionHasta
          ? {
              lte: filters.fechaFinalizacionHasta,
            }
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

    return where;
  }
}
