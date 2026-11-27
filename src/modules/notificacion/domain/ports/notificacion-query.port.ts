import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';

import {
  ContadoresNotificacion,
  NotificacionBandejaFiltros,
  NotificacionBandejaItem,
} from '../read-models/notificacion-bandeja.read-model';

export const NOTIFICACION_QUERY = Symbol('NOTIFICACION_QUERY');

/** Destino de una notificación; los roles con el valor que guarda la BD. */
export type DestinoUsuarios = {
  usuarioIds?: readonly number[];
  roles?: readonly string[];
  todos?: boolean;
};

export interface NotificacionQueryPort {
  /** Bandeja del usuario, sin las descartadas. La más reciente primero por omisión. */
  findBandeja(
    usuarioId: number,
    filtros: NotificacionBandejaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<NotificacionBandejaItem>>;

  contar(usuarioId: number): Promise<ContadoresNotificacion>;

  /**
   * Ids de los usuarios **activos** que caen en el destino, sin repetidos.
   * Un id de usuario inactivo o inexistente se descarta.
   */
  resolverDestinatarios(destino: DestinoUsuarios): Promise<number[]>;
}
