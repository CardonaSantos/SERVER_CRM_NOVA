import { Injectable } from '@nestjs/common';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialPaginatedResult } from '../../domain/read-models/ticket-soporte-historial-list.read-model';
import { RegistrarActualizacionTicketCommand } from '../contracts/registrar-actualizacion-ticket.command';
import { RegistrarTicketHistorialCommand } from '../contracts/registrar-ticket-historial.command';
import { ListarTicketSoporteHistorialQueryDto } from '../dto/listar-ticket-soporte-historial-query.dto';
import { ListarTicketSoporteHistorialUseCase } from '../use-cases/listar-ticket-soporte-historial.use-case';
import { ObtenerTicketSoporteHistorialUseCase } from '../use-cases/obtener-ticket-soporte-historial.use-case';
import { RegistrarActualizacionTicketUseCase } from '../use-cases/registrar-actualizacion-ticket.use-case';
import { RegistrarTicketSoporteHistorialUseCase } from '../use-cases/registrar-ticket-soporte-historial.use-case';

/**
 * Fachada de aplicación que otros módulos pueden inyectar sin conocer
 * el repositorio ni Prisma.
 */
@Injectable()
export class TicketSoporteHistorialService {
  constructor(
    private readonly registrarEventoUseCase: RegistrarTicketSoporteHistorialUseCase,
    private readonly registrarActualizacionUseCase: RegistrarActualizacionTicketUseCase,
    private readonly listarUseCase: ListarTicketSoporteHistorialUseCase,
    private readonly obtenerUseCase: ObtenerTicketSoporteHistorialUseCase,
  ) {}

  registrarEvento(
    command: RegistrarTicketHistorialCommand,
  ): Promise<TicketSoporteHistorialEntity> {
    return this.registrarEventoUseCase.execute(command);
  }

  registrarActualizacion(
    command: RegistrarActualizacionTicketCommand,
  ): Promise<TicketSoporteHistorialEntity | null> {
    return this.registrarActualizacionUseCase.execute(command);
  }

  listar(
    query: ListarTicketSoporteHistorialQueryDto,
  ): Promise<TicketSoporteHistorialPaginatedResult> {
    return this.listarUseCase.execute(query);
  }

  listarPorTicket(
    ticketId: number,
    query: ListarTicketSoporteHistorialQueryDto,
  ): Promise<TicketSoporteHistorialPaginatedResult> {
    return this.listarUseCase.execute({
      ...query,
      ticketId,
    });
  }

  obtenerPorId(id: number): Promise<TicketSoporteHistorialEntity | null> {
    return this.obtenerUseCase.execute(id);
  }
}
