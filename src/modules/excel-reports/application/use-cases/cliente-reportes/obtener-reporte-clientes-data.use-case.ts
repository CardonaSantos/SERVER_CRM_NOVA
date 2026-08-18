import { Inject, Injectable } from '@nestjs/common';
import { ClienteReporteFilters } from 'src/modules/excel-reports/domain/filters/clientes-query-filters';
import {
  CLIENTE_REPORTE_QUERY_PORT,
  ClienteReporteQueryPort,
} from 'src/modules/excel-reports/domain/ports/cliente-reportes/cliente-reporte-query.port';
import { ClienteReporteData } from 'src/modules/excel-reports/domain/read-models/cliente-reportes/cliente-reporte-data';

@Injectable()
export class ObtenerReporteClientesDataUseCase {
  constructor(
    @Inject(CLIENTE_REPORTE_QUERY_PORT)
    private readonly clienteReporteQuery: ClienteReporteQueryPort,
  ) {}

  async execute(filters: ClienteReporteFilters): Promise<ClienteReporteData> {
    const [clientes, resumen] = await Promise.all([
      this.clienteReporteQuery.findRows(filters),

      this.clienteReporteQuery.getResumen(filters),
    ]);

    return {
      resumen,
      clientes,
    };
  }
}
