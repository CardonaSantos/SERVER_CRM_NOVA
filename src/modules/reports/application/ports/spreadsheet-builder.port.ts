//declaro mi contrato del constructor
export interface SpreadsheetBuilderPort {
  createWorkbook(): void;
  addSheet(name: string): void;
  setHeader(
    columns: { key: string; title: string; width?: number; numFmt?: string }[],
  ): void;
  addRows(rows: Record<string, any>[]): void;
  autoFit(): void;
  toBuffer(): Promise<Buffer>;
}
