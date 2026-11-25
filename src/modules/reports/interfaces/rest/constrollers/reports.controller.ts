import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  Logger,
} from '@nestjs/common';
import { CreateReportDto } from '../../../dto/create-report.dto';
import { UpdateReportDto } from '../../../dto/update-report.dto';
import { ClientesInternetReportRequest } from '../http-dto/clientes-internet.report.request';
import { Response } from 'express';
import { ClientesInternetReportUseCase } from 'src/modules/reports/application/use-cases/clientes-internet/clientes-internet.use-case';

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  constructor(private readonly clientesUC: ClientesInternetReportUseCase) {}
  //GET DE REPORTE DE CLIENTES
  // ReportsController
  @Get('clientes-internet.xlsx')
  async clientes(
    @Query() q: ClientesInternetReportRequest,
    @Res() res: Response,
  ) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(q, null, 2)}`);
    try {
      const { buffer, filename } = await this.clientesUC.execute({
        desde: q.desde ? new Date(q.desde) : undefined,
        hasta: q.hasta ? new Date(q.hasta) : undefined,
        sectorId: q.sectorId,
        planId: q.planId,
        activos: q.activos !== undefined ? q.activos === 'true' : undefined,
      });

      this.logger.log(
        `Generado Excel: ${filename} (bytes: ${buffer?.length ?? 0})`,
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.status(200).send(buffer); // send ya hace end()
    } catch (err) {
      this.logger.error(`Error generando Excel`, err as any);
      res
        .status(500)
        .json({
          message: 'Error generando Excel',
          detail: (err as any)?.message,
        });
    }
  }
}
