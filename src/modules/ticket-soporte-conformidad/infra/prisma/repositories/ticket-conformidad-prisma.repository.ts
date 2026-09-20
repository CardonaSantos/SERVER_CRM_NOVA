import { Injectable } from '@nestjs/common';
import { TicketConformidadResultado as PrismaTicketConformidadResultado } from '@prisma/client';

import { TicketConformidadEntity } from '../../../domain/entities/ticket-conformidad.entity';
import { TicketConformidadResultado } from '../../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketConformidadRepositoryPort } from '../../../domain/ports/ticket-conformidad.repository.port';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketConformidadPrismaMapper } from '../../mappers/ticket-conformidad-prisma.mapper';

@Injectable()
export class TicketConformidadPrismaRepository
  implements TicketConformidadRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: TicketConformidadEntity,
  ): Promise<TicketConformidadEntity> {
    const data = TicketConformidadPrismaMapper.toCreatePersistence(entity);

    const created = await this.prisma.ticketConformidad.create({
      data,
    });

    return TicketConformidadPrismaMapper.toDomain(created);
  }

  async update(
    entity: TicketConformidadEntity,
  ): Promise<TicketConformidadEntity> {
    const id = entity.id;

    if (id === null) {
      throw new Error(
        'No se puede actualizar una conformidad sin id persistido.',
      );
    }

    const data = TicketConformidadPrismaMapper.toUpdatePersistence(entity);

    const updated = await this.prisma.ticketConformidad.update({
      where: {
        id,
      },
      data,
    });

    return TicketConformidadPrismaMapper.toDomain(updated);
  }

  async findById(id: number): Promise<TicketConformidadEntity | null> {
    const record = await this.prisma.ticketConformidad.findUnique({
      where: {
        id,
      },
    });

    return record ? TicketConformidadPrismaMapper.toDomain(record) : null;
  }

  async findLatestByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null> {
    const record = await this.prisma.ticketConformidad.findFirst({
      where: {
        ticketId,
      },
      orderBy: [
        {
          creadoEn: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return record ? TicketConformidadPrismaMapper.toDomain(record) : null;
  }

  async findAllByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity[]> {
    const records = await this.prisma.ticketConformidad.findMany({
      where: {
        ticketId,
      },
      orderBy: [
        {
          creadoEn: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return records.map((record) =>
      TicketConformidadPrismaMapper.toDomain(record),
    );
  }

  async findPendingByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null> {
    const record = await this.prisma.ticketConformidad.findFirst({
      where: {
        ticketId,
        resultado: PrismaTicketConformidadResultado.PENDIENTE,
      },
      orderBy: [
        {
          creadoEn: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return record ? TicketConformidadPrismaMapper.toDomain(record) : null;
  }

  async existsById(id: number): Promise<boolean> {
    const record = await this.prisma.ticketConformidad.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    return record !== null;
  }

  async existsByTicketAndResultado(
    ticketId: number,
    resultado: TicketConformidadResultado,
  ): Promise<boolean> {
    const prismaResultado =
      TicketConformidadPrismaMapper.resultadoToPrisma(resultado);

    const record = await this.prisma.ticketConformidad.findFirst({
      where: {
        ticketId,
        resultado: prismaResultado,
      },
      select: {
        id: true,
      },
    });

    return record !== null;
  }
}
