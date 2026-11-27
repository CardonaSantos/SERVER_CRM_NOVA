import { Injectable } from '@nestjs/common';
import { MetasTicketsService } from 'src/metas-tickets/metas-tickets.service';
import { MetasTicketPort } from '../../application/ports/metas-ticket.port';

/** Transitorio hasta refactorizar `ticket-soporte-metrica`. */
@Injectable()
export class MetasTicketLegacyAdapter implements MetasTicketPort {
  constructor(private readonly metas: MetasTicketsService) {}

  async sumarResuelto(tecnicoId: number): Promise<void> {
    await this.metas.incrementMeta(tecnicoId);
  }
}
