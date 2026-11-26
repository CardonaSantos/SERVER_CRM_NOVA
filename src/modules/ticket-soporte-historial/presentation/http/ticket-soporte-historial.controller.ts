import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListarTicketSoporteHistorialUseCase } from '../../application/use-cases/listar-ticket-soporte-historial.use-case';
import { ObtenerTicketSoporteHistorialUseCase } from '../../application/use-cases/obtener-ticket-soporte-historial.use-case';
import { ListarTicketSoporteHistorialQueryDto } from '../dto/listar-ticket-soporte-historial-query.dto';
import { TicketSoporteHistorialPresenter } from '../presenters/ticket-soporte-historial.presenter';

/**
 * Solo lectura: las entradas las crean los servicios internos, nunca un POST
 * que el cliente pueda manipular.
 */
@ApiTags('ticket-soporte-historial')
@Controller('ticket-soporte-historial')
export class TicketSoporteHistorialController {
  constructor(
    private readonly listarHistorial: ListarTicketSoporteHistorialUseCase,
    private readonly obtenerHistorial: ObtenerTicketSoporteHistorialUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ListarTicketSoporteHistorialQueryDto) {
    return TicketSoporteHistorialPresenter.listado(
      await this.listarHistorial.execute(this.aInput(query)),
    );
  }

  @Get('ticket/:ticketId')
  async listarPorTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query() query: ListarTicketSoporteHistorialQueryDto,
  ) {
    return TicketSoporteHistorialPresenter.listado(
      await this.listarHistorial.execute({ ...this.aInput(query), ticketId }),
    );
  }

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    return TicketSoporteHistorialPresenter.item(
      await this.obtenerHistorial.execute(id),
    );
  }

  private aInput(query: ListarTicketSoporteHistorialQueryDto) {
    return {
      page: query.page,
      limit: query.limit,
      ticketId: query.ticketId,
      usuarioId: query.usuarioId,
      tipo: query.tipo,
      search: query.search,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      orden: query.sortDir ?? query.ordenDireccion,
    };
  }
}
