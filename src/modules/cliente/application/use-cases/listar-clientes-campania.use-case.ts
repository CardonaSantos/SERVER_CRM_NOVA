import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENTE_LISTADO_QUERY,
  ClienteListadoQueryPort,
} from '../../domain/ports/cliente-listado-query.port';
import {
  ClienteCampaniaFiltros,
  ClienteCampaniaItem,
} from '../../domain/read-models/cliente-listado.read-model';

/** Destinatarios posibles de una campaña de mensajería. */
@Injectable()
export class ListarClientesCampaniaUseCase {
  constructor(
    @Inject(CLIENTE_LISTADO_QUERY)
    private readonly consulta: ClienteListadoQueryPort,
  ) {}

  execute(filtros: ClienteCampaniaFiltros): Promise<ClienteCampaniaItem[]> {
    return this.consulta.findParaCampania(filtros);
  }
}
