import { Inject, Injectable } from '@nestjs/common';
import {
  DireccionOrden,
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  TICKET_QUERY,
  TicketQueryPort,
} from '../../domain/ports/ticket-query.port';
import { ActividadTicket } from '../../domain/read-models/ticket-actividad.read-model';
import { AccesoTicketService } from '../services/acceso-ticket.service';

export type ListarActividadTicketInput = {
  ticketId: number;
  usuarioId: number;
  gestiona: boolean;
  soloAsignadosA?: number;
  page?: number;
  limit?: number;
  sortDir?: DireccionOrden;
};

export type ActividadTicketVisible = ActividadTicket & {
  /** Solo el autor edita su comentario. */
  puedeEditar: boolean;
  /** Vale para el comentario y para cada una de sus imágenes. */
  puedeEliminar: boolean;
};

@Injectable()
export class ListarActividadTicketUseCase {
  constructor(
    private readonly acceso: AccesoTicketService,
    @Inject(TICKET_QUERY) private readonly consulta: TicketQueryPort,
  ) {}

  async execute(
    input: ListarActividadTicketInput,
  ): Promise<ResultadoPaginado<ActividadTicketVisible>> {
    await this.acceso.exigir(input.ticketId, input.soloAsignadosA);

    const resultado = await this.consulta.findActividad(
      input.ticketId,
      normalizarPaginacion(input),
      input.sortDir ?? 'desc',
    );

    return {
      ...resultado,
      items: resultado.items.map((item) => {
        const vigente = item.tipo === 'COMENTARIO' && item.eliminado === null;
        const propio = item.autor.id === input.usuarioId;

        return {
          ...item,
          puedeEditar: vigente && propio,
          puedeEliminar: vigente && (input.gestiona || propio),
        };
      }),
    };
  }
}
