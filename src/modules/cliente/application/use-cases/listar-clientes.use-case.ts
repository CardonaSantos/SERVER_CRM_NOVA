import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  CLIENTE_LISTADO_QUERY,
  ClienteListadoQueryPort,
} from '../../domain/ports/cliente-listado-query.port';
import {
  ClienteTablaFiltros,
  ClienteTablaItem,
  ResumenCartera,
} from '../../domain/read-models/cliente-listado.read-model';
import {
  CLASIFICACION_CREDITO,
  ClasificacionCredito,
  ClasificacionCreditoPort,
} from '../ports/clasificacion-credito.port';

export type ListarClientesInput = ClienteTablaFiltros & {
  page?: number;
  limit?: number;
};

export type ClienteClasificado = ClienteTablaItem & {
  clasificacionCredito: ClasificacionCredito;
};

export type ListarClientesResult = ResultadoPaginado<ClienteClasificado> & {
  resumen: ResumenCartera;
};

/** La tabla de clientes con su clasificación de crédito y la cartera. */
@Injectable()
export class ListarClientesUseCase {
  constructor(
    @Inject(CLIENTE_LISTADO_QUERY)
    private readonly consulta: ClienteListadoQueryPort,
    @Inject(CLASIFICACION_CREDITO)
    private readonly credito: ClasificacionCreditoPort,
  ) {}

  async execute(input: ListarClientesInput): Promise<ListarClientesResult> {
    const { page, limit, ...filtros } = input;

    const [pagina, resumen] = await Promise.all([
      this.consulta.findTabla(filtros, normalizarPaginacion({ page, limit })),
      this.consulta.contarCartera(),
    ]);

    const items = await Promise.all(
      pagina.items.map(async (cliente) => ({
        ...cliente,
        clasificacionCredito: await this.credito.clasificar(cliente.facturas),
      })),
    );

    return { ...pagina, items, resumen };
  }
}
