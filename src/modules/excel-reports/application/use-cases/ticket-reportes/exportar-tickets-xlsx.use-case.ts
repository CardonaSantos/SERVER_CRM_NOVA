import { Inject, Injectable } from '@nestjs/common';

import {
  GeneratedXlsx,
  XLSX_WRITER_PORT,
  XlsxWriterPort,
} from '../../../domain/ports/xlsx-writer.port';

import { ObtenerReporteTicketsDataUseCase } from './obtener-reporte-tickets-data.use-case';
import { TicketReporteFilters } from 'src/modules/excel-reports/domain/filters/ticket-reporte/tickets-query-filters';
import { TicketReporteXlsxMapper } from 'src/modules/excel-reports/common/tickets-reporte/ticket-reporte-xlsx.mapper';

@Injectable()
export class ExportarTicketsXlsxUseCase {
  constructor(
    private readonly obtenerReporteTicketsData: ObtenerReporteTicketsDataUseCase,

    @Inject(XLSX_WRITER_PORT)
    private readonly xlsxWriter: XlsxWriterPort,
  ) {}

  async execute(filters: TicketReporteFilters): Promise<GeneratedXlsx> {
    const data = await this.obtenerReporteTicketsData.execute(filters);

    const document = TicketReporteXlsxMapper.toDocument(data);

    return this.xlsxWriter.write(document);
  }
}
