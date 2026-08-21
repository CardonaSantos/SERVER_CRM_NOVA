export type XlsxCellValue = string | number | boolean | Date | null;

export type XlsxColumnFormat =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'currency_gtq'
  | 'percentage'
  | 'date'
  | 'datetime';

export interface XlsxTable {
  title?: string;

  headers: string[];

  rows: XlsxCellValue[][];

  /**
   * Anchos de columnas en el mismo orden
   * que headers.
   */
  widths?: number[];

  /**
   * Formato nativo de Excel por columna.
   *
   * Debe seguir el mismo orden que headers.
   *
   * null = sin formato explícito.
   */
  columnFormats?: Array<XlsxColumnFormat | null>;
}

export interface XlsxSheet {
  name: string;

  title?: string;

  tables: XlsxTable[];
}

export interface XlsxDocument {
  filename: string;

  /**
   * Zona horaria en la que deben materializarse
   * las celdas Date.
   *
   * Excel no conserva timezone.
   *
   * Ejemplo:
   * America/Guatemala
   */
  timezone?: string;

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

// export type XlsxCellValue = string | number | boolean | Date | null;

// export interface XlsxTable {
//   title?: string;

//   headers: string[];

//   rows: XlsxCellValue[][];

//   /**
//    * Anchos de columnas en el mismo orden
//    * que headers.
//    */
//   widths?: number[];
// }

// export interface XlsxSheet {
//   name: string;

//   title?: string;

//   tables: XlsxTable[];
// }

// export interface XlsxDocument {
//   filename: string;

//   sheets: XlsxSheet[];
// }

// export interface GeneratedXlsx {
//   filename: string;

//   mimeType: string;

//   buffer: Buffer;
// }

// export interface XlsxWriterPort {
//   write(document: XlsxDocument): Promise<GeneratedXlsx>;
// }

// export const XLSX_WRITER_PORT = Symbol('XLSX_WRITER_PORT');
