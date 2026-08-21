import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { dayjs } from 'src/Utils/dayjs.config';

import { ExportarClientesReporteDto } from '../../../application/dto/clientes-report/clientes-dto.dto';

import { ExportarTicketsReporteDto } from '../../../application/dto/ticket-report/tickets-dto.dto';

import { ExportarClientesXlsxUseCase } from '../../../application/use-cases/cliente-reportes/exportar-clientes-xlsx.use-case';

import { ExportarTicketsXlsxUseCase } from '../../../application/use-cases/ticket-reportes/exportar-tickets-xlsx.use-case';

import { ClienteReporteFilters } from '../../../domain/filters/cliente-reporte/clientes-query-filters';

import { FacturacionReporteFilters } from '../../../domain/filters/facturacion-reporte/facturacion-reporte-filters';

import { TicketReporteFilters } from '../../../domain/filters/ticket-reporte/tickets-query-filters';
import { ExportarFacturacionXlsxUseCase } from 'src/modules/excel-reports/application/use-cases/facturacion-reporte/exportar-facturacion-xlsx.use-case';
import { ExportarFacturacionReporteDto } from 'src/modules/excel-reports/application/dto/facturacion-reporte/facturacion-reporte.dto';

@Controller('excel-reports')
@UseGuards(JwtAuthGuard)
export class ExcelReportsController {
  constructor(
    private readonly exportarClientesXlsx: ExportarClientesXlsxUseCase,

    private readonly exportarTicketsXlsx: ExportarTicketsXlsxUseCase,

    private readonly exportarFacturacionXlsx: ExportarFacturacionXlsxUseCase,
  ) {}

  // =====================================================
  // CLIENTES
  // =====================================================

  @Get('clientes')
  async exportarClientes(
    @Query()
    dto: ExportarClientesReporteDto,
  ): Promise<StreamableFile> {
    const filters = this.toClienteFilters(dto);

    const file = await this.exportarClientesXlsx.execute(filters);

    return new StreamableFile(file.buffer, {
      type: file.mimeType,

      disposition: `attachment; filename="${this.buildClienteFilename()}"`,
    });
  }

  // =====================================================
  // TICKETS
  // =====================================================

  @Get('tickets')
  async exportarTickets(
    @Query(
      new ValidationPipe({
        transform: true,

        whitelist: true,

        forbidNonWhitelisted: true,
      }),
    )
    dto: ExportarTicketsReporteDto,
  ): Promise<StreamableFile> {
    const filters = this.toTicketFilters(dto);

    const file = await this.exportarTicketsXlsx.execute(filters);

    return new StreamableFile(file.buffer, {
      type: file.mimeType,

      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  // =====================================================
  // FACTURACIÓN
  // =====================================================

  @Get('facturacion')
  async exportarFacturacion(
    @Query(
      new ValidationPipe({
        transform: true,

        whitelist: true,

        forbidNonWhitelisted: true,
      }),
    )
    dto: ExportarFacturacionReporteDto,
  ): Promise<StreamableFile> {
    const filters = this.toFacturacionFilters(dto);

    const file = await this.exportarFacturacionXlsx.execute(filters);

    return new StreamableFile(file.buffer, {
      type: file.mimeType,

      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  // =====================================================
  // CLIENT FILTERS
  // =====================================================

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

  // =====================================================
  // TICKET FILTERS
  // =====================================================

  private toTicketFilters(
    dto: ExportarTicketsReporteDto,
  ): TicketReporteFilters {
    return {
      fechaDesde: this.toGuatemalaCalendarDate(dto.fechaDesde),

      fechaHasta: this.toGuatemalaCalendarDate(dto.fechaHasta),

      agrupacion: dto.agrupacion,

      estados: dto.estados,

      prioridades: dto.prioridades,

      etiquetaIds: dto.etiquetaIds,

      tecnicoIds: dto.tecnicoIds,

      clienteId: dto.clienteId,
    };
  }

  // =====================================================
  // FACTURACIÓN FILTERS
  // =====================================================

  private toFacturacionFilters(
    dto: ExportarFacturacionReporteDto,
  ): FacturacionReporteFilters {
    return {
      periodoDesde: dto.periodoDesde,

      periodoHasta: dto.periodoHasta,

      mesesProyeccion: dto.mesesProyeccion,

      estadosFactura: dto.estadosFactura,

      zonaIds: dto.zonaIds,

      creadorIds: dto.creadorIds,

      clienteId: dto.clienteId,

      metodosPago: dto.metodosPago,

      origenesPago: dto.origenesPago,

      cobradorIds: dto.cobradorIds,

      rutaIds: dto.rutaIds,
    };
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private toGuatemalaCalendarDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    return dayjs.tz(value).startOf('day').toDate();
  }

  private buildClienteFilename(): string {
    const now = new Date();

    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('Z', '');

    return `reporte-clientes-${timestamp}.xlsx`;
  }
}

// import {
//   Controller,
//   Get,
//   Query,
//   StreamableFile,
//   UseGuards,
//   ValidationPipe,
// } from '@nestjs/common';

// import { ClienteReporteFilters } from '../../../domain/filters/cliente-reporte/clientes-query-filters';
// import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
// import { ExportarClientesXlsxUseCase } from '../../../application/use-cases/cliente-reportes/exportar-clientes-xlsx.use-case';
// import { ExportarClientesReporteDto } from '../../../application/dto/clientes-report/clientes-dto.dto';
// import { ExportarTicketsReporteDto } from 'src/modules/excel-reports/application/dto/ticket-report/tickets-dto.dto';
// import { ExportarTicketsXlsxUseCase } from 'src/modules/excel-reports/application/use-cases/ticket-reportes/exportar-tickets-xlsx.use-case';
// import { TicketReporteFilters } from 'src/modules/excel-reports/domain/filters/ticket-reporte/tickets-query-filters';
// import { dayjs } from 'src/Utils/dayjs.config';

// @Controller('excel-reports')
// @UseGuards(JwtAuthGuard)
// export class ExcelReportsController {
//   constructor(
//     private readonly exportarClientesXlsx: ExportarClientesXlsxUseCase,
//     private readonly exportarTicketsXlsx: ExportarTicketsXlsxUseCase,
//   ) {}

//   /**
//    * GENERAR REPORTE DE CLIENTES Y DEMAS
//    * @param dto R
//    * @returns
//    */
//   @Get('clientes')
//   async exportarClientes(
//     @Query()
//     dto: ExportarClientesReporteDto,
//   ): Promise<StreamableFile> {
//     const filters = this.toClienteFilters(dto);

//     const file = await this.exportarClientesXlsx.execute(filters);

//     return new StreamableFile(file.buffer, {
//       type: file.mimeType,
//       disposition: `attachment; filename="${this.buildFilename()}"`,
//     });
//   }

//   @Get('tickets')
//   async exportarTickets(
//     @Query(
//       new ValidationPipe({
//         transform: true,

//         whitelist: true,

//         forbidNonWhitelisted: true,
//       }),
//     )
//     dto: ExportarTicketsReporteDto,
//   ): Promise<StreamableFile> {
//     const filters = this.toTicketFilters(dto);

//     const file = await this.exportarTicketsXlsx.execute(filters);

//     return new StreamableFile(file.buffer, {
//       type: file.mimeType,

//       /**
//        * Para tickets usamos directamente
//        * el nombre generado por
//        * TicketReporteXlsxMapper.
//        *
//        * Ese nombre ya contiene:
//        *
//        * - rango
//        * - fecha
//        * - hora
//        */
//       disposition: `attachment; filename="${file.filename}"`,
//     });
//   }

//   private toClienteFilters(
//     dto: ExportarClientesReporteDto,
//   ): ClienteReporteFilters {
//     return {
//       search: dto.search,

//       estado: dto.estado,

//       estadoCobranza: dto.estadoCobranza,

//       servicioInternetId: dto.servicioInternetId,

//       sectorId: dto.sectorId,

//       municipioId: dto.municipioId,

//       departamentoId: dto.departamentoId,

//       fechaCreadoDesde: dto.fechaCreadoDesde
//         ? new Date(dto.fechaCreadoDesde)
//         : undefined,

//       fechaCreadoHasta: dto.fechaCreadoHasta
//         ? new Date(dto.fechaCreadoHasta)
//         : undefined,

//       incluirEliminados: dto.incluirEliminados,
//     };
//   }

//   private toTicketFilters(
//     dto: ExportarTicketsReporteDto,
//   ): TicketReporteFilters {
//     return {
//       fechaDesde: this.toGuatemalaCalendarDate(dto.fechaDesde),

//       fechaHasta: this.toGuatemalaCalendarDate(dto.fechaHasta),

//       agrupacion: dto.agrupacion,

//       estados: dto.estados,

//       prioridades: dto.prioridades,

//       etiquetaIds: dto.etiquetaIds,

//       tecnicoIds: dto.tecnicoIds,

//       clienteId: dto.clienteId,
//     };
//   }

//   private toGuatemalaCalendarDate(value?: string): Date | undefined {
//     if (!value) {
//       return undefined;
//     }

//     return dayjs.tz(value).startOf('day').toDate();
//   }

//   private buildFilename(): string {
//     const now = new Date();

//     const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('Z', '');

//     return `reporte-clientes-${timestamp}.xlsx`;
//   }
// }
