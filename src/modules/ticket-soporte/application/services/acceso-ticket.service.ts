import { Inject, Injectable } from '@nestjs/common';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import {
  TicketNoAsignadoError,
  TicketNoEncontradoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';

@Injectable()
export class AccesoTicketService {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
  ) {}

  /** El ticket, si existe y quien pregunta puede verlo. */
  async exigir(
    ticketId: number,
    soloAsignadosA?: number,
  ): Promise<TicketEntity> {
    const ticket = await this.tickets.findById(ticketId);

    if (!ticket) throw new TicketNoEncontradoError();
    if (soloAsignadosA !== undefined && !ticket.estaAsignado(soloAsignadosA)) {
      throw new TicketNoAsignadoError();
    }

    return ticket;
  }
}
