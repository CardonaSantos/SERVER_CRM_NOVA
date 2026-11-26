import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialRepositoryPort } from '../../domain/ports/ticket-soporte-historial-repository.port';
import { TicketSoporteHistorialPrismaMapper } from './ticket-soporte-historial-prisma.mapper';

@Injectable()
export class TicketSoporteHistorialPrismaRepository
  implements TicketSoporteHistorialRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: TicketSoporteHistorialEntity,
  ): Promise<TicketSoporteHistorialEntity> {
    const registro = await this.db.ticketSoporteHistorial.create({
      data: TicketSoporteHistorialPrismaMapper.toCreatePersistence(entity),
    });

    return TicketSoporteHistorialPrismaMapper.toDomain(registro);
  }
}
