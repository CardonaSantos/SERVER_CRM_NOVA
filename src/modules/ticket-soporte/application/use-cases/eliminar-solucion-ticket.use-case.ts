import { Inject, Injectable, Logger } from '@nestjs/common';
import { SolucionTicketNoEncontradaError } from '../../domain/errors/ticket-soporte.errors';
import {
  SOLUCION_TICKET_REPOSITORY,
  SolucionTicketRepositoryPort,
} from '../../domain/ports/solucion-ticket-repository.port';

@Injectable()
export class EliminarSolucionTicketUseCase {
  private readonly logger = new Logger(EliminarSolucionTicketUseCase.name);

  constructor(
    @Inject(SOLUCION_TICKET_REPOSITORY)
    private readonly soluciones: SolucionTicketRepositoryPort,
  ) {}

  /** Borrado lógico: los tickets resueltos con ella la conservan. */
  async execute(input: {
    solucionId: number;
    usuarioId: number;
  }): Promise<{ solucionId: number }> {
    const solucion = await this.soluciones.findById(input.solucionId);
    if (!solucion) throw new SolucionTicketNoEncontradaError();

    solucion.eliminar();
    await this.soluciones.update(solucion);

    this.logger.log(
      `Solución ${input.solucionId} eliminada por el usuario ${input.usuarioId}.`,
    );

    return { solucionId: input.solucionId };
  }
}
