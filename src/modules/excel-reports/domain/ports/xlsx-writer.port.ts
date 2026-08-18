export type XlsxCellValue = string | number | boolean | Date | null;

export interface XlsxTable {
  title?: string;

  headers: string[];

  rows: XlsxCellValue[][];

  /**
   * Anchos de columnas en el mismo orden
   * que headers.
   */
  widths?: number[];
}

export interface XlsxSheet {
  name: string;

  title?: string;

  tables: XlsxTable[];
}

export interface XlsxDocument {
  filename: string;

  sheets: XlsxSheet[];
}

export interface GeneratedXlsx {
  filename: string;

  mimeType: string;

  buffer: Buffer;
}

export interface XlsxWriterPort {
  write(document: XlsxDocument): Promise<GeneratedXlsx>;
}

export const XLSX_WRITER_PORT = Symbol('XLSX_WRITER_PORT');
