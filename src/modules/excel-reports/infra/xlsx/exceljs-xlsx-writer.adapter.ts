import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import {
  GeneratedXlsx,
  XlsxColumnFormat,
  XlsxDocument,
  XlsxWriterPort,
} from '../../domain/ports/xlsx-writer.port';

@Injectable()
export class ExcelJsXlsxWriterAdapter implements XlsxWriterPort {
  async write(document: XlsxDocument): Promise<GeneratedXlsx> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'NOVA Sistemas';

    workbook.created = new Date();

    for (const sheetDefinition of document.sheets) {
      const worksheet = workbook.addWorksheet(sheetDefinition.name);

      let currentRow = 1;

      if (sheetDefinition.title) {
        const titleCell = worksheet.getCell(currentRow, 1);

        titleCell.value = sheetDefinition.title;

        titleCell.font = {
          bold: true,
          size: 16,
        };

        currentRow += 2;
      }

      for (const table of sheetDefinition.tables) {
        if (table.title) {
          const tableTitle = worksheet.getCell(currentRow, 1);

          tableTitle.value = table.title;

          tableTitle.font = {
            bold: true,
            size: 12,
          };

          currentRow += 1;
        }

        // ===============================================
        // HEADER
        // ===============================================

        const headerRow = worksheet.getRow(currentRow);

        table.headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);

          cell.value = header;

          cell.font = {
            bold: true,
          };

          cell.alignment = {
            vertical: 'middle',
          };
        });

        currentRow += 1;

        // ===============================================
        // DATA
        // ===============================================

        for (const row of table.rows) {
          const worksheetRow = worksheet.getRow(currentRow);

          row.forEach((value, index) => {
            const cell = worksheetRow.getCell(index + 1);

            /**
             * Conservamos number y Date como
             * valores nativos de Excel.
             */
            cell.value = value;

            const format = table.columnFormats?.[index];

            cell.value = this.resolveCellValue(
              value,
              format,
              document.timezone,
            );

            if (format) {
              cell.numFmt = this.resolveNumberFormat(format);
            }
          });

          currentRow += 1;
        }

        // ===============================================
        // WIDTHS
        // ===============================================

        if (table.widths) {
          table.widths.forEach((width, index) => {
            const column = worksheet.getColumn(index + 1);

            column.width = Math.max(column.width ?? 0, width);
          });
        }

        currentRow += 2;
      }

      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];
    }

    const result = await workbook.xlsx.writeBuffer();

    return {
      filename: document.filename,

      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      buffer: Buffer.from(result),
    };
  }

  // =====================================================
  // FORMATOS NATIVOS EXCEL
  // =====================================================

  private resolveNumberFormat(format: XlsxColumnFormat): string {
    switch (format) {
      case 'text':
        return '@';

      case 'integer':
        return '#,##0';

      case 'decimal':
        return '#,##0.00';

      case 'currency_gtq':
        return '"Q" #,##0.00';

      case 'percentage':
        return '0.00%';

      case 'date':
        return 'dd/mm/yyyy';

      case 'datetime':
        return 'dd/mm/yyyy hh:mm';

      default:
        return 'General';
    }
  }

  private resolveCellValue(
    value: unknown,
    format: XlsxColumnFormat | null | undefined,
    timezone?: string,
  ): ExcelJS.CellValue {
    if (
      !(value instanceof Date) ||
      !timezone ||
      (format !== 'date' && format !== 'datetime')
    ) {
      return value as ExcelJS.CellValue;
    }

    return this.toExcelWallClockDate(value, timezone, format);
  }

  /**
   * Excel almacena fechas como valores sin timezone.
   *
   * Por ejemplo:
   *
   * 10:00 America/Guatemala
   * =
   * 16:00 UTC
   *
   * Si pasamos el Date original directamente,
   * Excel termina mostrando 16:00.
   *
   * Este método conserva los componentes visuales
   * de Guatemala dentro del serial de Excel.
   */
  private toExcelWallClockDate(
    value: Date,
    timezone: string,
    format: 'date' | 'datetime',
  ): Date {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,

      year: 'numeric',

      month: '2-digit',

      day: '2-digit',

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(value);

    const getPart = (type: Intl.DateTimeFormatPartTypes): number => {
      const part = parts.find((item) => item.type === type);

      if (!part) {
        throw new Error(
          `No fue posible resolver ${type} para timezone ${timezone}.`,
        );
      }

      return Number(part.value);
    };

    const year = getPart('year');

    const month = getPart('month');

    const day = getPart('day');

    /**
     * Para campos exclusivamente de fecha
     * eliminamos cualquier componente horario.
     */
    if (format === 'date') {
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    const hour = getPart('hour');

    const minute = getPart('minute');

    const second = getPart('second');

    return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  }
}

// import { Injectable } from '@nestjs/common';
// import * as ExcelJS from 'exceljs';

// import {
//   GeneratedXlsx,
//   XlsxDocument,
//   XlsxWriterPort,
// } from '../../domain/ports/xlsx-writer.port';

// @Injectable()
// export class ExcelJsXlsxWriterAdapter implements XlsxWriterPort {
//   async write(document: XlsxDocument): Promise<GeneratedXlsx> {
//     const workbook = new ExcelJS.Workbook();

//     workbook.creator = 'NOVA Sistemas';

//     workbook.created = new Date();

//     for (const sheetDefinition of document.sheets) {
//       const worksheet = workbook.addWorksheet(sheetDefinition.name);

//       let currentRow = 1;

//       if (sheetDefinition.title) {
//         const titleCell = worksheet.getCell(currentRow, 1);

//         titleCell.value = sheetDefinition.title;

//         titleCell.font = {
//           bold: true,
//           size: 16,
//         };

//         currentRow += 2;
//       }

//       for (const table of sheetDefinition.tables) {
//         if (table.title) {
//           const tableTitle = worksheet.getCell(currentRow, 1);

//           tableTitle.value = table.title;

//           tableTitle.font = {
//             bold: true,
//             size: 12,
//           };

//           currentRow += 1;
//         }

//         const headerRow = worksheet.getRow(currentRow);

//         table.headers.forEach((header, index) => {
//           const cell = headerRow.getCell(index + 1);

//           cell.value = header;

//           cell.font = {
//             bold: true,
//           };

//           cell.alignment = {
//             vertical: 'middle',
//           };
//         });

//         currentRow += 1;

//         for (const row of table.rows) {
//           const worksheetRow = worksheet.getRow(currentRow);

//           row.forEach((value, index) => {
//             worksheetRow.getCell(index + 1).value = value;
//           });

//           currentRow += 1;
//         }

//         if (table.widths) {
//           table.widths.forEach((width, index) => {
//             const column = worksheet.getColumn(index + 1);

//             column.width = Math.max(column.width ?? 0, width);
//           });
//         }

//         /**
//          * Espacio entre secciones.
//          */
//         currentRow += 2;
//       }

//       worksheet.views = [
//         {
//           state: 'frozen',
//           ySplit: 1,
//         },
//       ];
//     }

//     const result = await workbook.xlsx.writeBuffer();

//     return {
//       filename: document.filename,

//       mimeType:
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

//       buffer: Buffer.from(result),
//     };
//   }
// }
