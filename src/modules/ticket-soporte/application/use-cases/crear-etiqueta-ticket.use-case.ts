import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EtiquetaTicketEntity } from '../../domain/entities/etiqueta-ticket.entity';
import { EtiquetaTicketNombreDuplicadoError } from '../../domain/errors/ticket-soporte.errors';
import {
  ETIQUETA_TICKET_REPOSITORY,
  EtiquetaTicketRepositoryPort,
} from '../../domain/ports/etiqueta-ticket-repository.port';

@Injectable()
export class CrearEtiquetaTicketUseCase {
  constructor(
    @Inject(ETIQUETA_TICKET_REPOSITORY)
    private readonly etiquetas: EtiquetaTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  /** Si el nombre era de una etiqueta eliminada, la recupera. */
  execute(input: { nombre: string }): Promise<EtiquetaTicketEntity> {
    const nueva = EtiquetaTicketEntity.create(input.nombre);

    return this.unidad.ejecutar(async () => {
      await this.etiquetas.bloquearNombres();
      const existente = await this.etiquetas.findByNombre(nueva.nombre);

      if (!existente) return this.etiquetas.create(nueva);
      if (!existente.eliminada) throw new EtiquetaTicketNombreDuplicadoError();

      existente.restaurar(nueva.nombre);

      return this.etiquetas.update(existente);
    });
  }
}
