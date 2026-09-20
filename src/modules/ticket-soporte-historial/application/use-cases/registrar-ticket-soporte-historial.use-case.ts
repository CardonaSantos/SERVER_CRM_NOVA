import { Inject, Injectable } from '@nestjs/common';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import {
  TICKET_SOPORTE_HISTORIAL_REPOSITORY,
  TicketSoporteHistorialRepositoryPort,
} from '../../domain/ports/ticket-soporte-historial-repository.port';
import { RegistrarTicketHistorialCommand } from '../contracts/registrar-ticket-historial.command';
import { TicketSoporteHistorialEntryFactory } from '../factories/ticket-soporte-historial-entry.factory';

@Injectable()
export class RegistrarTicketSoporteHistorialUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_REPOSITORY)
    private readonly repository: TicketSoporteHistorialRepositoryPort,
  ) {}

  execute(
    command: RegistrarTicketHistorialCommand,
  ): Promise<TicketSoporteHistorialEntity> {
    const entity = TicketSoporteHistorialEntryFactory.fromEvento(command);
    return this.repository.create(entity);
  }
}
