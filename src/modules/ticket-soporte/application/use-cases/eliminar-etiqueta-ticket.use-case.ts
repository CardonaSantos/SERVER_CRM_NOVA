import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { EtiquetaTicketNoEncontradaError } from '../../domain/errors/ticket-soporte.errors';
import {
  ETIQUETA_TICKET_REPOSITORY,
  EtiquetaTicketRepositoryPort,
} from '../../domain/ports/etiqueta-ticket-repository.port';

@Injectable()
export class EliminarEtiquetaTicketUseCase {
  private readonly logger = new Logger(EliminarEtiquetaTicketUseCase.name);

  constructor(
    @Inject(ETIQUETA_TICKET_REPOSITORY)
    private readonly etiquetas: EtiquetaTicketRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** Borrado lógico: los tickets que la tienen la conservan. */
  async execute(input: {
    etiquetaId: number;
    usuarioId: number;
  }): Promise<{ etiquetaId: number }> {
    const etiqueta = await this.etiquetas.findById(input.etiquetaId);
    if (!etiqueta) throw new EtiquetaTicketNoEncontradaError();

    etiqueta.eliminar(input.usuarioId, this.reloj.ahora());
    await this.etiquetas.update(etiqueta);

    this.logger.log(
      `Etiqueta ${input.etiquetaId} eliminada por el usuario ${input.usuarioId}.`,
    );

    return { etiquetaId: input.etiquetaId };
  }
}
