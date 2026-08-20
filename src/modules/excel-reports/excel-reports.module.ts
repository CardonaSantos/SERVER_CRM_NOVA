import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CLIENTE_REPORTE_QUERY_PORT } from './domain/ports/cliente-reportes/cliente-reporte-query.port';

import { TICKET_REPORTE_QUERY_PORT } from './domain/ports/ticket-reportes/ticket-reporte-query.port';

import { XLSX_WRITER_PORT } from './domain/ports/xlsx-writer.port';

import { ExcelReportsController } from './presentation/controllers/cliente-report/excel-reports.controller';

import { ObtenerReporteClientesDataUseCase } from './application/use-cases/cliente-reportes/obtener-reporte-clientes-data.use-case';

import { ExportarClientesXlsxUseCase } from './application/use-cases/cliente-reportes/exportar-clientes-xlsx.use-case';

import { ObtenerReporteTicketsDataUseCase } from './application/use-cases/ticket-reportes/obtener-reporte-tickets-data.use-case';

import { ExportarTicketsXlsxUseCase } from './application/use-cases/ticket-reportes/exportar-tickets-xlsx.use-case';

import { ClienteReportePrismaQuery } from './infra/prisma/cliente-report/cliente-reporte-prisma.query';

import { TicketReportePrismaQuery } from './infra/prisma/ticket-report/ticket-reporte-prisma.query';

import { ExcelJsXlsxWriterAdapter } from './infra/xlsx/exceljs-xlsx-writer.adapter';

@Module({
  imports: [PrismaModule],

  controllers: [ExcelReportsController],

  providers: [
    ObtenerReporteClientesDataUseCase,
    ExportarClientesXlsxUseCase,

    ObtenerReporteTicketsDataUseCase,
    ExportarTicketsXlsxUseCase,

    {
      provide: CLIENTE_REPORTE_QUERY_PORT,
      useClass: ClienteReportePrismaQuery,
    },

    // QUERY ADAPTER - TICKETS
    {
      provide: TICKET_REPORTE_QUERY_PORT,
      useClass: TicketReportePrismaQuery,
    },

    // XLSX ADAPTER COMPARTIDO

    {
      provide: XLSX_WRITER_PORT,
      useClass: ExcelJsXlsxWriterAdapter,
    },
  ],
})
export class ExcelReportsModule {}
