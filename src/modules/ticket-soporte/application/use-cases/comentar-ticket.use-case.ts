import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { ComentarioTicketEntity } from '../../domain/entities/comentario-ticket.entity';
import {
  ArchivoImagen,
  validarImagenes,
} from '../../domain/policies/imagen-comentario.policy';
import {
  COMENTARIO_TICKET_REPOSITORY,
  ComentarioTicketRepositoryPort,
} from '../../domain/ports/comentario-ticket-repository.port';
import {
  IMAGEN_COMENTARIO,
  ImagenComentarioPort,
} from '../ports/imagen-comentario.port';
import { AccesoTicketService } from '../services/acceso-ticket.service';

export type ComentarTicketInput = {
  ticketId: number;
  usuarioId: number;
  empresaId: number;
  soloAsignadosA?: number;
  texto?: string | null;
  imagenes: ArchivoImagen[];
};

@Injectable()
export class ComentarTicketUseCase {
  private readonly logger = new Logger(ComentarTicketUseCase.name);

  constructor(
    private readonly acceso: AccesoTicketService,
    @Inject(COMENTARIO_TICKET_REPOSITORY)
    private readonly comentarios: ComentarioTicketRepositoryPort,
    @Inject(IMAGEN_COMENTARIO)
    private readonly almacen: ImagenComentarioPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ComentarTicketInput): Promise<{ comentarioId: number }> {
    const ticket = await this.acceso.exigir(
      input.ticketId,
      input.soloAsignadosA,
    );
    // Se valida todo antes de subir el primer archivo.
    const imagenes = validarImagenes(input.imagenes);
    const comentario = ComentarioTicketEntity.create(
      { ...input, totalImagenes: imagenes.length },
      this.reloj.ahora(),
    );
    const subidas: number[] = [];

    try {
      for (const imagen of imagenes) {
        subidas.push(
          await this.almacen.guardar({
            ...imagen,
            empresaId: input.empresaId,
            clienteId: ticket.clienteId,
            ticketId: input.ticketId,
            subidoPorId: input.usuarioId,
          }),
        );
      }

      const guardado = await this.unidad.ejecutar(() =>
        this.comentarios.create(comentario, subidas),
      );

      return { comentarioId: guardado.id! };
    } catch (error) {
      await this.compensar(subidas, input.empresaId);
      throw error;
    }
  }

  private async compensar(mediaIds: number[], empresaId: number) {
    const resultados = await Promise.allSettled(
      mediaIds.map((id) => this.almacen.eliminar(id, empresaId)),
    );

    resultados.forEach((resultado, i) => {
      if (resultado.status === 'rejected') {
        this.logger.error(`Quedó sin borrar la media ${mediaIds[i]}.`);
      }
    });
  }
}
