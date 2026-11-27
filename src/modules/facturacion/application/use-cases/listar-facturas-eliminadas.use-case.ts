import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  FACTURA_QUERY,
  FacturaQueryPort,
} from '../../domain/ports/factura-query.port';
import { FacturaEliminadaItem } from '../../domain/read-models/factura.read-model';

export type ListarFacturasEliminadasInput = {
  search?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarFacturasEliminadasUseCase {
  constructor(
    @Inject(FACTURA_QUERY) private readonly consulta: FacturaQueryPort,
  ) {}

  execute(
    input: ListarFacturasEliminadasInput,
  ): Promise<ResultadoPaginado<FacturaEliminadaItem>> {
    return this.consulta.findEliminadas(
      input.search,
      normalizarPaginacion({ page: input.page, limit: input.limit }),
    );
  }
}
