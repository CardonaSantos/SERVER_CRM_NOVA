// src/modules/reports/application/use-cases/clientes-internet/clientes-internet.use-case.ts
import { ClientesInternetQueryRepo } from '../../../domain/repositories/clientes-internet.query-repo';
import { SpreadsheetBuilderPort } from '../../ports/spreadsheet-builder.port';
import { header, mapRow } from './clientes-internet.row-mapper';

export class ClientesInternetReportUseCase {
  constructor(
    private readonly repo: ClientesInternetQueryRepo, // <— interfaz
    private readonly sheet: SpreadsheetBuilderPort,
  ) {}

  async execute(filters: {
    desde?: Date;
    hasta?: Date;
    sectorId?: number;
    planId?: number;
    activos?: boolean;
  }) {
    const data = await this.repo.findClientes(filters); // <— nombre correcto

    this.sheet.createWorkbook();
    this.sheet.addSheet('Clientes Internet');
    this.sheet.setHeader(header);
    this.sheet.addRows(data.map(mapRow));
    const buffer = await this.sheet.toBuffer();

    return { buffer, filename: `clientes_internet_${Date.now()}.xlsx` };
  }
}
