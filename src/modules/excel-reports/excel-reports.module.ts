import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CLIENTE_REPORTE_QUERY_PORT } from './domain/ports/cliente-reportes/cliente-reporte-query.port';

import { FACTURACION_REPORTE_QUERY_PORT } from './domain/ports/facturacion-reportes/facturacion-reporte-query.port';

import { TICKET_REPORTE_QUERY_PORT } from './domain/ports/ticket-reportes/ticket-reporte-query.port';

import { XLSX_WRITER_PORT } from './domain/ports/xlsx-writer.port';

import { ExcelReportsController } from './presentation/controllers/cliente-report/excel-reports.controller';

import { ObtenerReporteClientesDataUseCase } from './application/use-cases/cliente-reportes/obtener-reporte-clientes-data.use-case';

import { ExportarClientesXlsxUseCase } from './application/use-cases/cliente-reportes/exportar-clientes-xlsx.use-case';

import { ClienteReportePrismaQuery } from './infra/prisma/cliente-report/cliente-reporte-prisma.query';

import { ObtenerReporteTicketsDataUseCase } from './application/use-cases/ticket-reportes/obtener-reporte-tickets-data.use-case';

import { ExportarTicketsXlsxUseCase } from './application/use-cases/ticket-reportes/exportar-tickets-xlsx.use-case';

import { TicketReportePrismaQuery } from './infra/prisma/ticket-report/ticket-reporte-prisma.query';

import { FacturacionReportePrismaQuery } from './infra/prisma/facturacion-report/facturacion-reporte-prisma.query';

import { ExcelJsXlsxWriterAdapter } from './infra/xlsx/exceljs-xlsx-writer.adapter';
import { ObtenerReporteFacturacionDataUseCase } from './application/use-cases/facturacion-reporte/obtener-reporte-facturacion-data.use-case';
import { ExportarFacturacionXlsxUseCase } from './application/use-cases/facturacion-reporte/exportar-facturacion-xlsx.use-case';

@Module({
  imports: [PrismaModule],

  controllers: [ExcelReportsController],

  providers: [
    // CLIENTES

    ObtenerReporteClientesDataUseCase,

    ExportarClientesXlsxUseCase,

    {
      provide: CLIENTE_REPORTE_QUERY_PORT,

      useClass: ClienteReportePrismaQuery,
    },

    // TICKETS

    ObtenerReporteTicketsDataUseCase,

    ExportarTicketsXlsxUseCase,

    {
      provide: TICKET_REPORTE_QUERY_PORT,

      useClass: TicketReportePrismaQuery,
    },

    // FACTURACIÓN

    ObtenerReporteFacturacionDataUseCase,

    ExportarFacturacionXlsxUseCase,

    {
      provide: FACTURACION_REPORTE_QUERY_PORT,

      useClass: FacturacionReportePrismaQuery,
    },

    // XLSX

    {
      provide: XLSX_WRITER_PORT,

      useClass: ExcelJsXlsxWriterAdapter,
    },
  ],
})
export class ExcelReportsModule {}
