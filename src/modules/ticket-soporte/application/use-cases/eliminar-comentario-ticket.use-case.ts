import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ComentarioNoEncontradoError } from '../../domain/errors/ticket-soporte.errors';
import {
  COMENTARIO_TICKET_REPOSITORY,
  ComentarioTicketRepositoryPort,
} from '../../domain/ports/comentario-ticket-repository.port';
import { AccesoTicketService } from '../services/acceso-ticket.service';

export type EliminarComentarioTicketInput = {
  ticketId: number;
  comentarioId: number;
  usuarioId: number;
  gestiona: boolean;
  soloAsignadosA?: number;
};

/** Borrado lógico: el texto y las imágenes dejan de mostrarse, no se destruyen. */
@Injectable()
export class EliminarComentarioTicketUseCase {
  private readonly logger = new Logger(EliminarComentarioTicketUseCase.name);

  constructor(
    private readonly acceso: AccesoTicketService,
    @Inject(COMENTARIO_TICKET_REPOSITORY)
    private readonly comentarios: ComentarioTicketRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EliminarComentarioTicketInput,
  ): Promise<{ comentarioId: number }> {
    await this.acceso.exigir(input.ticketId, input.soloAsignadosA);

    const comentario = await this.comentarios.findById(input.comentarioId);
    if (!comentario || comentario.ticketId !== input.ticketId) {
      throw new ComentarioNoEncontradoError();
    }

    comentario.eliminar(input.usuarioId, input.gestiona, this.reloj.ahora());
    await this.comentarios.marcarEliminado(comentario);

    this.logger.log(
      `Comentario ${input.comentarioId} eliminado por el usuario ${input.usuarioId}.`,
    );

    return { comentarioId: input.comentarioId };
  }
}
