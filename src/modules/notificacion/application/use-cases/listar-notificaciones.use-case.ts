import { Inject, Injectable } from '@nestjs/common';

import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';

import {
  NOTIFICACION_QUERY,
  NotificacionQueryPort,
} from '../../domain/ports/notificacion-query.port';
import {
  NotificacionBandejaFiltros,
  NotificacionBandejaItem,
} from '../../domain/read-models/notificacion-bandeja.read-model';

export type ListarNotificacionesInput = {
  usuarioId: number;
  filtros: NotificacionBandejaFiltros;
  page?: number;
  limit?: number;
};

/** Bandeja de quien consulta: nadie ve la de otro. */
@Injectable()
export class ListarNotificacionesUseCase {
  constructor(
    @Inject(NOTIFICACION_QUERY)
    private readonly consulta: NotificacionQueryPort,
  ) {}

  execute(
    input: ListarNotificacionesInput,
  ): Promise<ResultadoPaginado<NotificacionBandejaItem>> {
    return this.consulta.findBandeja(
      input.usuarioId,
      input.filtros,
      normalizarPaginacion(input),
    );
  }
}
