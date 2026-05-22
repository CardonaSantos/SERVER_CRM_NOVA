import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { CreateGenerateReportDto } from '../dto/create-generate-report.dto';
import { UpdateGenerateReportDto } from '../dto/update-generate-report.dto';
import { GenerateReportsService } from '../app/generate-reports.service';
import {
  ExportInfoDto,
  GenerateHistorialPagosDto,
} from '../dto/generate-historial-pagos.dto';
import { Response } from 'express';
import { QueryCobranzaReport } from '../dto/cobranza-query-report';
import { QueryTicketsDailyReportDto } from '../dto/ticket-metricas.dto';

@Controller('generate-reports')
export class GenerateReportsController {
  constructor(
    private readonly generateReportsService: GenerateReportsService,
  ) {}

  @Post('historial-pagos')
  async generateHistorialPagos(
    @Body() dto: GenerateHistorialPagosDto,
    @Res() res: Response,
  ) {
    const buffer = await this.generateReportsService.generateHistorialPagos(
      dto.ids,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="historial_pagos${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('exportar-info')
  async exportInfo(@Body() dto: ExportInfoDto, @Res() res: Response) {
    const buffer = await this.generateReportsService.exportInfo(dto.ids);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="clientes_export_${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('cobranza')
  async exportCobranzaReport(
    @Body() dto: QueryCobranzaReport,
    @Res() res: Response,
  ) {
    const buffer = await this.generateReportsService.cobranzaReport(dto);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cobranza_report${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('tickets/diario')
  async exportTicketsDailyReport(
    @Body() dto: QueryTicketsDailyReportDto,
    @Res() res: Response,
  ) {
    const buffer = await this.generateReportsService.ticketsDailyReport(dto);

    const dateLabel =
      dto.fecha ?? dto.fechaInicio ?? new Date().toISOString().slice(0, 10);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tickets_report_${dateLabel}_${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
