import { Injectable } from '@nestjs/common';

import { TicketFirmaEntity } from '../../../domain/entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../../../domain/enums/ticket-firma-tipo.enum';
import { TicketFirmaRepositoryPort } from '../../../domain/ports/ticket-firma.repository.port';
import { TicketFirmaPrismaMapper } from '../../mappers/ticket-firma-prisma.mapper';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketFirmaPrismaRepository implements TicketFirmaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: TicketFirmaEntity): Promise<TicketFirmaEntity> {
    const data = TicketFirmaPrismaMapper.toCreatePersistence(entity);

    const created = await this.prisma.ticketFirma.create({
      data,
    });

    return TicketFirmaPrismaMapper.toDomain(created);
  }

  async findById(id: number): Promise<TicketFirmaEntity | null> {
    const record = await this.prisma.ticketFirma.findUnique({
      where: {
        id,
      },
    });

    return record ? TicketFirmaPrismaMapper.toDomain(record) : null;
  }

  async findByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<TicketFirmaEntity | null> {
    const prismaTipo = TicketFirmaPrismaMapper.tipoToPrisma(tipo);

    const record = await this.prisma.ticketFirma.findUnique({
      where: {
        conformidadId_tipo: {
          conformidadId,
          tipo: prismaTipo,
        },
      },
    });

    return record ? TicketFirmaPrismaMapper.toDomain(record) : null;
  }

  async findAllByConformidadId(
    conformidadId: number,
  ): Promise<TicketFirmaEntity[]> {
    const records = await this.prisma.ticketFirma.findMany({
      where: {
        conformidadId,
      },
      orderBy: [
        {
          firmadoEn: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return records.map((record) => TicketFirmaPrismaMapper.toDomain(record));
  }

  async existsByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<boolean> {
    const prismaTipo = TicketFirmaPrismaMapper.tipoToPrisma(tipo);

    const record = await this.prisma.ticketFirma.findUnique({
      where: {
        conformidadId_tipo: {
          conformidadId,
          tipo: prismaTipo,
        },
      },
      select: {
        id: true,
      },
    });

    return record !== null;
  }
}
