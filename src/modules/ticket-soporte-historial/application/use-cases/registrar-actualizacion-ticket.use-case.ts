import { Inject, Injectable } from '@nestjs/common';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import {
  TICKET_SOPORTE_HISTORIAL_REPOSITORY,
  TicketSoporteHistorialRepositoryPort,
} from '../../domain/ports/ticket-soporte-historial-repository.port';
import { RegistrarActualizacionTicketCommand } from '../contracts/registrar-actualizacion-ticket.command';
import { TicketSoporteHistorialEntryFactory } from '../factories/ticket-soporte-historial-entry.factory';

@Injectable()
export class RegistrarActualizacionTicketUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_REPOSITORY)
    private readonly repository: TicketSoporteHistorialRepositoryPort,
  ) {}

  async execute(
    command: RegistrarActualizacionTicketCommand,
  ): Promise<TicketSoporteHistorialEntity | null> {
    const entity = TicketSoporteHistorialEntryFactory.fromActualizacion(command);

    if (!entity) {
      return null;
    }

    return this.repository.create(entity);
  }
}
