import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { ClienteReporteFilters } from '../../domain/filters/clientes-query-filters';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
import { ExportarClientesXlsxUseCase } from '../../application/use-cases/cliente-reportes/exportar-clientes-xlsx.use-case';
import { ExportarClientesReporteDto } from '../../application/dto/clientes-dto.dto';

@Controller('excel-reports')
@UseGuards(JwtAuthGuard)
export class ExcelReportsController {
  constructor(
    private readonly exportarClientesXlsx: ExportarClientesXlsxUseCase,
  ) {}

  @Get('clientes')
  async exportarClientes(
    @Query()
    dto: ExportarClientesReporteDto,
  ): Promise<StreamableFile> {
    const filters = this.toClienteFilters(dto);

    const file = await this.exportarClientesXlsx.execute(filters);

    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      disposition: `attachment; filename="${this.buildFilename()}"`,
    });
  }

  private buildFilename(): string {
    const now = new Date();

    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('Z', '');

    return `reporte-clientes-${timestamp}.xlsx`;
  }

  private toClienteFilters(
    dto: ExportarClientesReporteDto,
  ): ClienteReporteFilters {
    return {
      search: dto.search,

      estado: dto.estado,

      estadoCobranza: dto.estadoCobranza,

      servicioInternetId: dto.servicioInternetId,

      sectorId: dto.sectorId,

      municipioId: dto.municipioId,

      departamentoId: dto.departamentoId,

      fechaCreadoDesde: dto.fechaCreadoDesde
        ? new Date(dto.fechaCreadoDesde)
        : undefined,

      fechaCreadoHasta: dto.fechaCreadoHasta
        ? new Date(dto.fechaCreadoHasta)
        : undefined,

      incluirEliminados: dto.incluirEliminados,
    };
  }
}
