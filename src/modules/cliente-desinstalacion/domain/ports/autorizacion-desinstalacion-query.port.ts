import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { AutorizacionDesinstalacionPendiente } from '../read-models/autorizacion-desinstalacion-pendiente.read-model';

export const AUTORIZACION_DESINSTALACION_QUERY = Symbol(
  'AUTORIZACION_DESINSTALACION_QUERY',
);

export interface AutorizacionDesinstalacionQueryPort {
  /** Solicitudes que todavía esperan respuesta, las más recientes primero. */
  findPendientes(
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<AutorizacionDesinstalacionPendiente>>;
}
