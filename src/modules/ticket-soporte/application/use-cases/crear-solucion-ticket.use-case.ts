import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { SolucionTicketEntity } from '../../domain/entities/solucion-ticket.entity';
import { SolucionTicketNombreDuplicadoError } from '../../domain/errors/ticket-soporte.errors';
import {
  SOLUCION_TICKET_REPOSITORY,
  SolucionTicketRepositoryPort,
} from '../../domain/ports/solucion-ticket-repository.port';

@Injectable()
export class CrearSolucionTicketUseCase {
  constructor(
    @Inject(SOLUCION_TICKET_REPOSITORY)
    private readonly soluciones: SolucionTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  /** Si el nombre era de una solución eliminada, la recupera. */
  execute(input: {
    nombre: string;
    descripcion?: string | null;
  }): Promise<SolucionTicketEntity> {
    const nueva = SolucionTicketEntity.create(input);

    return this.unidad.ejecutar(async () => {
      await this.soluciones.bloquearNombres();
      const existente = await this.soluciones.findByNombre(nueva.nombre);

      if (!existente) return this.soluciones.create(nueva);
      if (!existente.eliminada) throw new SolucionTicketNombreDuplicadoError();

      existente.restaurar(input);

      return this.soluciones.update(existente);
    });
  }
}
