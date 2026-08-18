import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CLIENTE_REPORTE_QUERY_PORT } from './domain/ports/cliente-reportes/cliente-reporte-query.port';

import { XLSX_WRITER_PORT } from './domain/ports/xlsx-writer.port';

import { ExcelReportsController } from './presentation/controllers/excel-reports.controller';
import { ObtenerReporteClientesDataUseCase } from './application/use-cases/cliente-reportes/obtener-reporte-clientes-data.use-case';
import { ExportarClientesXlsxUseCase } from './application/use-cases/cliente-reportes/exportar-clientes-xlsx.use-case';
import { ClienteReportePrismaQuery } from './infra/prisma/cliente-report/cliente-reporte-prisma.query';
import { ExcelJsXlsxWriterAdapter } from './infra/xlsx/exceljs-xlsx-writer.adapter';

@Module({
  imports: [PrismaModule],

  controllers: [ExcelReportsController],

  providers: [
    /**
     * Casos de uso
     */
    ObtenerReporteClientesDataUseCase,

    ExportarClientesXlsxUseCase,

    /**
     * Query adapter
     */
    {
      provide: CLIENTE_REPORTE_QUERY_PORT,

      useClass: ClienteReportePrismaQuery,
    },

    /**
     * XLSX adapter
     */
    {
      provide: XLSX_WRITER_PORT,

      useClass: ExcelJsXlsxWriterAdapter,
    },
  ],
})
export class ExcelReportsModule {}
