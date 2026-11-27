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

export type QuitarImagenComentarioTicketInput = {
  ticketId: number;
  comentarioId: number;
  imagenId: number;
  usuarioId: number;
  gestiona: boolean;
  soloAsignadosA?: number;
};

/** La imagen deja de mostrarse; el archivo no se destruye. */
@Injectable()
export class QuitarImagenComentarioTicketUseCase {
  private readonly logger = new Logger(
    QuitarImagenComentarioTicketUseCase.name,
  );

  constructor(
    private readonly acceso: AccesoTicketService,
    @Inject(COMENTARIO_TICKET_REPOSITORY)
    private readonly comentarios: ComentarioTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: QuitarImagenComentarioTicketInput,
  ): Promise<{ comentarioId: number; imagenId: number }> {
    const { comentarioId, imagenId, usuarioId } = input;
    await this.acceso.exigir(input.ticketId, input.soloAsignadosA);

    await this.unidad.ejecutar(async () => {
      const comentario = await this.comentarios.bloquear(comentarioId);
      if (!comentario || comentario.ticketId !== input.ticketId) {
        throw new ComentarioNoEncontradoError();
      }

      comentario.quitarImagen(imagenId, usuarioId, input.gestiona);
      await this.comentarios.quitarImagen(
        comentarioId,
        imagenId,
        usuarioId,
        this.reloj.ahora(),
      );
    });

    this.logger.log(
      `Imagen ${imagenId} del comentario ${comentarioId} quitada por el usuario ${usuarioId}.`,
    );

    return { comentarioId, imagenId };
  }
}
