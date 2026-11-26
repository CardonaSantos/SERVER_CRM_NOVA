import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { TicketSoporteHistorialQueryPort } from '../../domain/ports/ticket-soporte-historial-query.port';
import {
  TicketSoporteHistorialFiltros,
  TicketSoporteHistorialResumen,
} from '../../domain/read-models/ticket-soporte-historial.read-model';

export class TicketSoporteHistorialQueryFake
  implements TicketSoporteHistorialQueryPort
{
  readonly filas: TicketSoporteHistorialResumen[] = [];
  filtrosRecibidos: TicketSoporteHistorialFiltros | null = null;
  paginacionRecibida: Paginacion | null = null;

  findMany(
    filtros: TicketSoporteHistorialFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TicketSoporteHistorialResumen>> {
    this.filtrosRecibidos = filtros;
    this.paginacionRecibida = paginacion;

    return Promise.resolve({
      items: this.filas,
      total: this.filas.length,
      page: paginacion.page,
      limit: paginacion.limit,
    });
  }

  findById(id: number): Promise<TicketSoporteHistorialResumen | null> {
    return Promise.resolve(this.filas.find((f) => f.id === id) ?? null);
  }
}
