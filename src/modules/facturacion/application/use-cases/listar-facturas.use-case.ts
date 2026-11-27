import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  FACTURA_QUERY,
  FacturaQueryPort,
} from '../../domain/ports/factura-query.port';
import {
  FacturaFiltros,
  FacturaListItem,
  ResumenFacturas,
} from '../../domain/read-models/factura.read-model';

export type ListarFacturasInput = FacturaFiltros & {
  page?: number;
  limit?: number;
};

export type ListarFacturasResult = {
  facturas: ResultadoPaginado<FacturaListItem>;
  resumen: ResumenFacturas;
};

@Injectable()
export class ListarFacturasUseCase {
  constructor(
    @Inject(FACTURA_QUERY) private readonly consulta: FacturaQueryPort,
  ) {}

  async execute(input: ListarFacturasInput): Promise<ListarFacturasResult> {
    const { page, limit, ...filtros } = input;

    const [facturas, resumen] = await Promise.all([
      this.consulta.findMany(filtros, normalizarPaginacion({ page, limit })),
      this.consulta.resumir(filtros),
    ]);

    return { facturas, resumen };
  }
}
