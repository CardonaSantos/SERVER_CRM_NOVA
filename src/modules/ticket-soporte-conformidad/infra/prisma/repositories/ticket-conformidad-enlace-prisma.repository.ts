import { Injectable } from '@nestjs/common';
import { TicketConformidadEnlaceEntity } from '../../../domain/entities/ticket-conformidad-enlace.entity';
import { TicketConformidadEnlaceRepositoryPort } from '../../../domain/ports/ticket-conformidad-enlace.repository.port';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketConformidadEnlacePrismaMapper } from '../../mappers/ticket-conformidad-enlace-prisma.mapper';

@Injectable()
export class TicketConformidadEnlacePrismaRepository
  implements TicketConformidadEnlaceRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: TicketConformidadEnlaceEntity,
  ): Promise<TicketConformidadEnlaceEntity> {
    const data =
      TicketConformidadEnlacePrismaMapper.toCreatePersistence(entity);

    const created = await this.prisma.ticketConformidadEnlace.create({
      data,
    });

    return TicketConformidadEnlacePrismaMapper.toDomain(created);
  }

  async update(
    entity: TicketConformidadEnlaceEntity,
  ): Promise<TicketConformidadEnlaceEntity> {
    const id = entity.id;

    if (id === null) {
      throw new Error(
        'No se puede actualizar un enlace de conformidad sin id persistido.',
      );
    }

    const data =
      TicketConformidadEnlacePrismaMapper.toUpdatePersistence(entity);

    const updated = await this.prisma.ticketConformidadEnlace.update({
      where: {
        id,
      },
      data,
    });

    return TicketConformidadEnlacePrismaMapper.toDomain(updated);
  }

  async findById(id: number): Promise<TicketConformidadEnlaceEntity | null> {
    const record = await this.prisma.ticketConformidadEnlace.findUnique({
      where: {
        id,
      },
    });

    return record ? TicketConformidadEnlacePrismaMapper.toDomain(record) : null;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<TicketConformidadEnlaceEntity | null> {
    const record = await this.prisma.ticketConformidadEnlace.findUnique({
      where: {
        tokenHash,
      },
    });

    return record ? TicketConformidadEnlacePrismaMapper.toDomain(record) : null;
  }

  async findAllByConformidadId(
    conformidadId: number,
  ): Promise<TicketConformidadEnlaceEntity[]> {
    const records = await this.prisma.ticketConformidadEnlace.findMany({
      where: {
        conformidadId,
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
      TicketConformidadEnlacePrismaMapper.toDomain(record),
    );
  }

  async findActiveByConformidadId(
    conformidadId: number,
    fecha: Date,
  ): Promise<TicketConformidadEnlaceEntity[]> {
    const records = await this.prisma.ticketConformidadEnlace.findMany({
      where: {
        conformidadId,

        usadoEn: null,
        revocadoEn: null,

        expiraEn: {
          gt: fecha,
        },
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

    return records.map((record) =>
      TicketConformidadEnlacePrismaMapper.toDomain(record),
    );
  }

  async existsByTokenHash(tokenHash: string): Promise<boolean> {
    const record = await this.prisma.ticketConformidadEnlace.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
      },
    });

    return record !== null;
  }
}
