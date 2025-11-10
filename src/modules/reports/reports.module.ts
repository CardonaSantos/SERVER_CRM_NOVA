import { Module } from '@nestjs/common';
import { ReportsController } from './interfaces/rest/constrollers/reports.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpreadsheetBuilderExcelJS } from './infraestructure/spreadsheets/exceljs/spreadsheet-builder.exceljs';
import { ClientesInternetQueryRepoPrisma } from './infraestructure/persistence/prisma/clientes-internet.query-repo.prisma';
import { ClientesInternetReportUseCase } from './application/use-cases/clientes-internet/clientes-internet.use-case';

export const TOKENS = {
  SpreadsheetBuilder: Symbol('SpreadsheetBuilder'),
  ClientesInternetQueryRepo: Symbol('ClientesInternetQueryRepo'),
};

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [
    { provide: TOKENS.SpreadsheetBuilder, useClass: SpreadsheetBuilderExcelJS },
    {
      provide: TOKENS.ClientesInternetQueryRepo,
      useClass: ClientesInternetQueryRepoPrisma,
    },
    {
      provide: ClientesInternetReportUseCase,
      useFactory: (repo, sheet) =>
        new ClientesInternetReportUseCase(repo, sheet),
      inject: [TOKENS.ClientesInternetQueryRepo, TOKENS.SpreadsheetBuilder],
    },
  ],
})
export class ReportsModule {}
