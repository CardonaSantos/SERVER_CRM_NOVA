import { SpreadsheetBuilderPort } from 'src/modules/reports/application/ports/spreadsheet-builder.port';
import * as ExcelJS from 'exceljs';

export class SpreadsheetBuilderExcelJS implements SpreadsheetBuilderPort {
  private wb!: ExcelJS.Workbook;
  private ws!: ExcelJS.Worksheet;

  createWorkbook(): void {
    this.wb = new ExcelJS.Workbook();
  }

  addSheet(name: string): void {
    this.ws = this.wb.addWorksheet(name);
  }
  setHeader(
    columns: { key: string; title: string; width?: number; numFmt?: string }[],
  ): void {
    this.ws.columns = columns.map((c) => ({
      key: c.key,
      header: c.title,
      width: c.width ?? 18,
      style: c.numFmt ? { numFmt: c.numFmt } : {},
    }));
    this.ws.getRow(1).font = { bold: true };
  }
  addRows(rows: Record<string, any>[]): void {
    this.ws.addRows(rows);
  }
  autoFit(): void {
    //   opcional
  }
  async toBuffer(): Promise<Buffer> {
    return this.wb.xlsx.writeBuffer() as any;
  }
}
