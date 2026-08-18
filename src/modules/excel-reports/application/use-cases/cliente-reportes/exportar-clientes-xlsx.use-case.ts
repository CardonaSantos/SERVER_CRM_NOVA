import { Inject, Injectable } from '@nestjs/common';

import { ObtenerReporteClientesDataUseCase } from './obtener-reporte-clientes-data.use-case';
import {
  GeneratedXlsx,
  XLSX_WRITER_PORT,
  XlsxWriterPort,
} from 'src/modules/excel-reports/domain/ports/xlsx-writer.port';
import { ClienteReporteFilters } from 'src/modules/excel-reports/domain/filters/clientes-query-filters';
import { ClienteReporteXlsxMapper } from 'src/modules/excel-reports/common/cliente-reporte-xlsx.mapper';

@Injectable()
export class ExportarClientesXlsxUseCase {
  constructor(
    private readonly obtenerReporteClientesData: ObtenerReporteClientesDataUseCase,

    @Inject(XLSX_WRITER_PORT)
    private readonly xlsxWriter: XlsxWriterPort,
  ) {}

  async execute(filters: ClienteReporteFilters): Promise<GeneratedXlsx> {
    const data = await this.obtenerReporteClientesData.execute(filters);

    const document = ClienteReporteXlsxMapper.toDocument(data);

    return this.xlsxWriter.write(document);
  }
}
