import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { AutorizacionDesinstalacionQueryPort } from '../../domain/ports/autorizacion-desinstalacion-query.port';
import { AutorizacionDesinstalacionPendiente } from '../../domain/read-models/autorizacion-desinstalacion-pendiente.read-model';

export class AutorizacionDesinstalacionQueryFake
  implements AutorizacionDesinstalacionQueryPort
{
  paginacionRecibida: Paginacion | null = null;

  findPendientes(
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<AutorizacionDesinstalacionPendiente>> {
    this.paginacionRecibida = paginacion;

    return Promise.resolve({ items: [], total: 0, ...paginacion });
  }
}
