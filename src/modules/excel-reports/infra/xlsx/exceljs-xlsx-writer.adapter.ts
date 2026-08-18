import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import {
  GeneratedXlsx,
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

        for (const row of table.rows) {
          const worksheetRow = worksheet.getRow(currentRow);

          row.forEach((value, index) => {
            worksheetRow.getCell(index + 1).value = value;
          });

          currentRow += 1;
        }

        if (table.widths) {
          table.widths.forEach((width, index) => {
            const column = worksheet.getColumn(index + 1);

            column.width = Math.max(column.width ?? 0, width);
          });
        }

        /**
         * Espacio entre secciones.
         */
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
}
