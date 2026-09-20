import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { TicketSoporteHistorialService } from '../application/services/ticket-soporte-historial.service';
import { ListarTicketSoporteHistorialQueryDto } from '../application/dto/listar-ticket-soporte-historial-query.dto';
import { TicketSoporteHistorialPresenter } from './ticket-soporte-historial.presenter';

/**
 * HTTP deliberadamente READ-ONLY.
 *
 * La creación de auditorías se hace desde servicios internos del backend,
 * nunca desde un POST público manipulable por el cliente.
 */
@Controller('ticket-soporte-historial')
export class TicketSoporteHistorialController {
  constructor(
    private readonly historialService: TicketSoporteHistorialService,
  ) {}

  @Get()
  async findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    query: ListarTicketSoporteHistorialQueryDto,
  ) {
    const result = await this.historialService.listar(query);
    return TicketSoporteHistorialPresenter.paginatedToHttp(result);
  }

  @Get('ticket/:ticketId')
  async findByTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    query: ListarTicketSoporteHistorialQueryDto,
  ) {
    const result = await this.historialService.listarPorTicket(ticketId, query);
    return TicketSoporteHistorialPresenter.paginatedToHttp(result);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const entity = await this.historialService.obtenerPorId(id);

    if (!entity) {
      throw new NotFoundException('Registro de historial no encontrado');
    }

    return TicketSoporteHistorialPresenter.toHttp(entity);
  }
}
