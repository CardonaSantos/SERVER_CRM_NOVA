import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { SolucionTicketEntity } from '../../domain/entities/solucion-ticket.entity';
import {
  SolucionTicketNoEncontradaError,
  SolucionTicketNombreDuplicadoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  SOLUCION_TICKET_REPOSITORY,
  SolucionTicketRepositoryPort,
} from '../../domain/ports/solucion-ticket-repository.port';

@Injectable()
export class ActualizarSolucionTicketUseCase {
  constructor(
    @Inject(SOLUCION_TICKET_REPOSITORY)
    private readonly soluciones: SolucionTicketRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  execute(input: {
    solucionId: number;
    nombre?: string;
    descripcion?: string | null;
  }): Promise<SolucionTicketEntity> {
    return this.unidad.ejecutar(async () => {
      await this.soluciones.bloquearNombres();

      const solucion = await this.soluciones.findById(input.solucionId);
      if (!solucion) throw new SolucionTicketNoEncontradaError();
      solucion.editar(input);

      const otra = await this.soluciones.findByNombre(solucion.nombre);
      if (otra && otra.id !== solucion.id) {
        throw new SolucionTicketNombreDuplicadoError(
          otra.eliminada
            ? 'Ese nombre es de una solución eliminada: créala de nuevo para recuperarla.'
            : undefined,
        );
      }

      return this.soluciones.update(solucion);
    });
  }
}
