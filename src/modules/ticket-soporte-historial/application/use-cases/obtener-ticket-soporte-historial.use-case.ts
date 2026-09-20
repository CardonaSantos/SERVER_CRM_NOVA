import { Inject, Injectable } from '@nestjs/common';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import {
  TICKET_SOPORTE_HISTORIAL_REPOSITORY,
  TicketSoporteHistorialRepositoryPort,
} from '../../domain/ports/ticket-soporte-historial-repository.port';

@Injectable()
export class ObtenerTicketSoporteHistorialUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_REPOSITORY)
    private readonly repository: TicketSoporteHistorialRepositoryPort,
  ) {}

  execute(id: number): Promise<TicketSoporteHistorialEntity | null> {
    return this.repository.findById(id);
  }
}
