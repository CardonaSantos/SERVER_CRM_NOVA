import { Injectable } from '@nestjs/common';
import { TicketConformidadResultado as PrismaResultado } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';
import { TicketConformidadRepositoryPort } from '../../domain/ports/ticket-conformidad-repository.port';
import { TicketSoporteConformidadPrismaMapper } from './ticket-soporte-conformidad-prisma.mapper';

@Injectable()
export class TicketConformidadPrismaRepository
  implements TicketConformidadRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: TicketConformidadEntity,
  ): Promise<TicketConformidadEntity> {
    const registro = await this.db.ticketConformidad.create({
      data: TicketSoporteConformidadPrismaMapper.conformidadToCreatePersistence(
        entity,
      ),
    });

    return TicketSoporteConformidadPrismaMapper.conformidadToDomain(registro);
  }

  async findById(id: number): Promise<TicketConformidadEntity | null> {
    const registro = await this.db.ticketConformidad.findUnique({
      where: { id },
    });

    return registro
      ? TicketSoporteConformidadPrismaMapper.conformidadToDomain(registro)
      : null;
  }

  async findPendingByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null> {
    const registro = await this.db.ticketConformidad.findFirst({
      where: { ticketId, resultado: PrismaResultado.PENDIENTE },
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
    });

    return registro
      ? TicketSoporteConformidadPrismaMapper.conformidadToDomain(registro)
      : null;
  }
}
