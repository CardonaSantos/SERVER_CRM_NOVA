import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketSeguimientoService } from './ticket-seguimiento.service';
import { CreateTicketSeguimientoDto } from './dto/create-ticket-seguimiento.dto';
import { UpdateTicketSeguimientoDto } from './dto/update-ticket-seguimiento.dto';

@Controller('ticket-seguimiento')
export class TicketSeguimientoController {
  constructor(private readonly ticketSeguimientoService: TicketSeguimientoService) {}

  @Post()
  create(@Body() createTicketSeguimientoDto: CreateTicketSeguimientoDto) {
    return this.ticketSeguimientoService.create(createTicketSeguimientoDto);
  }

  @Get()
  findAll() {
    return this.ticketSeguimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketSeguimientoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketSeguimientoDto: UpdateTicketSeguimientoDto) {
    return this.ticketSeguimientoService.update(+id, updateTicketSeguimientoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketSeguimientoService.remove(+id);
  }
}
