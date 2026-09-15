import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialRepositoryPort } from '../../domain/ports/ticket-soporte-historial-repository.port';
import {
  TicketSoporteHistorialFindManyFilters,
  TicketSoporteHistorialPaginatedResult,
} from '../../domain/read-models/ticket-soporte-historial-list.read-model';
import { TicketSoporteHistorialPrismaMapper } from './ticket-soporte-historial-prisma.mapper';

@Injectable()
export class TicketSoporteHistorialPrismaRepository
  implements TicketSoporteHistorialRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: TicketSoporteHistorialEntity,
  ): Promise<TicketSoporteHistorialEntity> {
    const row = await this.prisma.ticketSoporteHistorial.create({
      data: TicketSoporteHistorialPrismaMapper.toCreateInput(entity),
    });

    return TicketSoporteHistorialPrismaMapper.toDomain(row);
  }

  async findById(id: number): Promise<TicketSoporteHistorialEntity | null> {
    const row = await this.prisma.ticketSoporteHistorial.findUnique({
      where: { id },
    });

    return row ? TicketSoporteHistorialPrismaMapper.toDomain(row) : null;
  }

  async findPaginated(
    filters: TicketSoporteHistorialFindManyFilters,
  ): Promise<TicketSoporteHistorialPaginatedResult> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

    const where: Prisma.TicketSoporteHistorialWhereInput = {
      ...(filters.ticketId && {
        ticketId: filters.ticketId,
      }),

      ...(filters.usuarioId && {
        usuarioId: filters.usuarioId,
      }),

      ...(filters.tipo && {
        tipo: TicketSoporteHistorialPrismaMapper.toPrismaTipo(filters.tipo),
      }),

      ...((filters.fechaDesde || filters.fechaHasta) && {
        creadoEn: {
          ...(filters.fechaDesde && {
            gte: filters.fechaDesde,
          }),
          ...(filters.fechaHasta && {
            lte: filters.fechaHasta,
          }),
        },
      }),

      ...(filters.search && {
        OR: [
          {
            descripcion: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            usuarioNombre: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const orderDirection = filters.ordenDireccion ?? 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.ticketSoporteHistorial.findMany({
        where,
        orderBy: [
          { creadoEn: orderDirection },
          { id: orderDirection },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticketSoporteHistorial.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map(TicketSoporteHistorialPrismaMapper.toDomain),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
