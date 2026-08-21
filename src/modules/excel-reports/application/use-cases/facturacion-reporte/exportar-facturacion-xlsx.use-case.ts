import { Inject, Injectable } from '@nestjs/common';

import { FacturacionReporteXlsxMapper } from '../../../common/facturacion-reporte/facturacion-reporte-xlsx.mapper';

import { FacturacionReporteFilters } from '../../../domain/filters/facturacion-reporte/facturacion-reporte-filters';

import {
  GeneratedXlsx,
  XLSX_WRITER_PORT,
  XlsxWriterPort,
} from '../../../domain/ports/xlsx-writer.port';

import { ObtenerReporteFacturacionDataUseCase } from './obtener-reporte-facturacion-data.use-case';

@Injectable()
export class ExportarFacturacionXlsxUseCase {
  constructor(
    private readonly obtenerReporteFacturacionData: ObtenerReporteFacturacionDataUseCase,

    @Inject(XLSX_WRITER_PORT)
    private readonly xlsxWriter: XlsxWriterPort,
  ) {}

  async execute(filters: FacturacionReporteFilters): Promise<GeneratedXlsx> {
    const data = await this.obtenerReporteFacturacionData.execute(filters);

    const document = FacturacionReporteXlsxMapper.toDocument(data);

    return this.xlsxWriter.write(document);
  }
}
