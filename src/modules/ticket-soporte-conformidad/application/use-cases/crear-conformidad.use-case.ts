import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';

import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad.repository.port';
import {
  TICKET_CONFORMIDAD_TICKET_PORT,
  TicketConformidadTicketPort,
} from '../port/ticket-conformidad-ticket.port';

export interface CrearTicketConformidadInput {
  ticketId: number;
  creadoPorId: number;
}

@Injectable()
export class CrearTicketConformidadUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidadRepository: TicketConformidadRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_TICKET_PORT)
    private readonly ticketPort: TicketConformidadTicketPort,
  ) {}

  async execute(
    input: CrearTicketConformidadInput,
  ): Promise<TicketConformidadEntity> {
    const ticket = await this.ticketPort.findContextById(input.ticketId);

    if (!ticket) {
      throw new NotFoundException(
        `No existe el ticket de soporte ${input.ticketId}.`,
      );
    }

    if (ticket.clienteId === null) {
      throw new ConflictException(
        'El ticket no tiene un cliente asociado y no puede solicitar conformidad.',
      );
    }

    const pendiente = await this.conformidadRepository.findPendingByTicketId(
      input.ticketId,
    );

    if (pendiente) {
      throw new ConflictException(
        'El ticket ya posee una solicitud de conformidad pendiente.',
      );
    }

    const conformidad = TicketConformidadEntity.create({
      ticketId: ticket.ticketId,

      clienteId: ticket.clienteId,
      tecnicoAsignadoId: ticket.tecnicoId,

      creadoPorId: input.creadoPorId,
    });

    return this.conformidadRepository.create(conformidad);
  }
}
