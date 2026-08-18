import {
  Controller,
  Get,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

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

    @Req()
    req: Request,
  ): Promise<StreamableFile> {
    /**
     * Sustituye esto por tu helper/actor
     * autenticado real.
     */

    const filters = this.toClienteFilters(dto);

    const file = await this.exportarClientesXlsx.execute(filters);

    return new StreamableFile(file.buffer, {
      type: file.mimeType,

      disposition: `attachment; filename="${file.filename}"`,
    });
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
