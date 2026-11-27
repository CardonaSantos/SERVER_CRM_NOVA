import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EtiquetaTicketEntity } from '../../domain/entities/etiqueta-ticket.entity';
import {
  EtiquetaTicketNoEncontradaError,
  EtiquetaTicketNombreDuplicadoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  ETIQUETA_TICKET_REPOSITORY,
  EtiquetaTicketRepositoryPort,
} from '../../domain/ports/etiqueta-ticket-repository.port';

@Injectable()
export class ActualizarEtiquetaTicketUseCase {
  constructor(
    @Inject(ETIQUETA_TICKET_REPOSITORY)
    private readonly etiquetas: EtiquetaTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  execute(input: {
    etiquetaId: number;
    nombre: string;
  }): Promise<EtiquetaTicketEntity> {
    return this.unidad.ejecutar(async () => {
      await this.etiquetas.bloquearNombres();

      const etiqueta = await this.etiquetas.findById(input.etiquetaId);
      if (!etiqueta) throw new EtiquetaTicketNoEncontradaError();
      etiqueta.renombrar(input.nombre);

      const otra = await this.etiquetas.findByNombre(etiqueta.nombre);
      if (otra && otra.id !== etiqueta.id) {
        throw new EtiquetaTicketNombreDuplicadoError(
          otra.eliminada
            ? 'Ese nombre es de una etiqueta eliminada: créala de nuevo para recuperarla.'
            : undefined,
        );
      }

      return this.etiquetas.update(etiqueta);
    });
  }
}
