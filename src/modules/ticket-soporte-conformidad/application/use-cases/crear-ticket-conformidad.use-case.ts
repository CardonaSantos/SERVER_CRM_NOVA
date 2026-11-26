import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';
import {
  TicketConformidadContextoIncompletoError,
  TicketConformidadPendienteExistenteError,
  TicketConformidadTicketNoEncontradoError,
} from '../../domain/errors/ticket-soporte-conformidad.errors';
import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad-repository.port';
import {
  TICKET_SOPORTE_CONTEXTO_QUERY,
  TicketSoporteContextoQueryPort,
} from '../../domain/ports/ticket-soporte-contexto-query.port';
import { TicketConformidadProps } from '../../domain/props/ticket-conformidad.props';

export type CrearTicketConformidadInput = {
  ticketId: number;
  creadoPorId: number;
};

export type CrearTicketConformidadResult = TicketConformidadProps;

@Injectable()
export class CrearTicketConformidadUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_CONTEXTO_QUERY)
    private readonly tickets: TicketSoporteContextoQueryPort,
    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidades: TicketConformidadRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearTicketConformidadInput,
  ): Promise<CrearTicketConformidadResult> {
    const ticket = await this.tickets.findContextById(input.ticketId);

    if (!ticket) throw new TicketConformidadTicketNoEncontradoError();

    if (ticket.clienteId === null) {
      throw new TicketConformidadContextoIncompletoError(
        'El ticket no tiene un cliente asociado y no puede solicitar conformidad.',
      );
    }

    if (await this.conformidades.findPendingByTicketId(input.ticketId)) {
      throw new TicketConformidadPendienteExistenteError();
    }

    const conformidad = TicketConformidadEntity.create(
      {
        ticketId: ticket.ticketId,
        clienteId: ticket.clienteId,
        tecnicoAsignadoId: ticket.tecnicoId,
        creadoPorId: input.creadoPorId,
      },
      this.reloj.ahora(),
    );

    const creada = await this.conformidades.create(conformidad);

    return creada.toPrimitives();
  }
}
