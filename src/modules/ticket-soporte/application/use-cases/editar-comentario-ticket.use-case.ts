import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { ComentarioNoEncontradoError } from '../../domain/errors/ticket-soporte.errors';
import {
  COMENTARIO_TICKET_REPOSITORY,
  ComentarioTicketRepositoryPort,
} from '../../domain/ports/comentario-ticket-repository.port';
import { AccesoTicketService } from '../services/acceso-ticket.service';

export type EditarComentarioTicketInput = {
  ticketId: number;
  comentarioId: number;
  usuarioId: number;
  soloAsignadosA?: number;
  texto: string;
};

@Injectable()
export class EditarComentarioTicketUseCase {
  private readonly logger = new Logger(EditarComentarioTicketUseCase.name);

  constructor(
    private readonly acceso: AccesoTicketService,
    @Inject(COMENTARIO_TICKET_REPOSITORY)
    private readonly comentarios: ComentarioTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EditarComentarioTicketInput,
  ): Promise<{ comentarioId: number }> {
    await this.acceso.exigir(input.ticketId, input.soloAsignadosA);

    await this.unidad.ejecutar(async () => {
      const comentario = await this.comentarios.bloquear(input.comentarioId);
      if (!comentario || comentario.ticketId !== input.ticketId) {
        throw new ComentarioNoEncontradoError();
      }

      if (comentario.editar(input.texto, input.usuarioId, this.reloj.ahora())) {
        await this.comentarios.guardarTexto(comentario);
        this.logger.log(
          `Comentario ${input.comentarioId} editado por el usuario ${input.usuarioId}.`,
        );
      }
    });

    return { comentarioId: input.comentarioId };
  }
}
