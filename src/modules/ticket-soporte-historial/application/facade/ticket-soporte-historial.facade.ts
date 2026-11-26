import { Injectable } from '@nestjs/common';
import {
  RegistrarActualizacionTicketInput,
  RegistrarEventoTicketHistorialInput,
  TicketSoporteHistorialFacadePort,
} from '../../public/ticket-soporte-historial.facade.port';
import { RegistrarActualizacionTicketUseCase } from '../use-cases/registrar-actualizacion-ticket.use-case';
import { RegistrarEventoTicketHistorialUseCase } from '../use-cases/registrar-evento-ticket-historial.use-case';

@Injectable()
export class TicketSoporteHistorialFacade
  implements TicketSoporteHistorialFacadePort
{
  constructor(
    private readonly registrarEventoUseCase: RegistrarEventoTicketHistorialUseCase,
    private readonly registrarActualizacionUseCase: RegistrarActualizacionTicketUseCase,
  ) {}

  registrarEvento(input: RegistrarEventoTicketHistorialInput): Promise<number> {
    return this.registrarEventoUseCase.execute(input);
  }

  registrarActualizacion(
    input: RegistrarActualizacionTicketInput,
  ): Promise<number | null> {
    return this.registrarActualizacionUseCase.execute(input);
  }
}
