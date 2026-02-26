import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateGenerateReportDto } from '../dto/create-generate-report.dto';
import { UpdateGenerateReportDto } from '../dto/update-generate-report.dto';
import { PrismaGenerateReports } from '../infraestructure/prisma-generate-reports.repository';
import {
  GENERATE_REPORTS,
  GenerateReportsRepository,
} from '../domain/generate-reports.repository';
import { QueryCobranzaReport } from '../dto/cobranza-query-report';

@Injectable()
export class GenerateReportsService {
  private readonly logger = new Logger(GenerateReportsService.name);
  constructor(
    @Inject(GENERATE_REPORTS)
    private readonly repo: GenerateReportsRepository,
  ) {}

  async generateHistorialPagos(ids: Array<number>) {
    this.logger.log('Peticion recibida');
    return await this.repo.generateHistorialPagos(ids);
  }

  async exportInfo(ids: Array<number>) {
    this.logger.log('Peticion recibida');

    return await this.repo.exportInfo(ids);
  }

  async cobranzaReport(dto: QueryCobranzaReport) {
    return await this.repo.cobranzaReport(dto);
  }
}
