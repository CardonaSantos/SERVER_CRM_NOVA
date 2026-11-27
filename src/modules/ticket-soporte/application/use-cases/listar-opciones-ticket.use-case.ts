import { Inject, Injectable } from '@nestjs/common';
import {
  TICKET_QUERY,
  TicketQueryPort,
} from '../../domain/ports/ticket-query.port';
import { OpcionesTicket } from '../../domain/read-models/catalogo-ticket.read-model';

@Injectable()
export class ListarOpcionesTicketUseCase {
  constructor(
    @Inject(TICKET_QUERY) private readonly consulta: TicketQueryPort,
  ) {}

  execute(): Promise<OpcionesTicket> {
    return this.consulta.findOpciones();
  }
}
