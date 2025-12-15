import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { TicketsSoporteService } from '../app/tickets-soporte.service';
import { CreateTicketsSoporteDto } from '../dto/create-tickets-soporte.dto';
import { UpdateTicketsSoporteDto } from '../dto/update-tickets-soporte.dto';
import { CloseTicketDto } from '../dto/CloseTicketDto .dto';

@Controller('tickets-soporte')
export class TicketsSoporteController {
  constructor(private readonly ticketsSoporteService: TicketsSoporteService) {}

  // ===== CREATE =====
  @Post()
  create(@Body() createTicketsSoporteDto: CreateTicketsSoporteDto) {
    return this.ticketsSoporteService.create(createTicketsSoporteDto);
  }

  // ===== READ =====
  @Get()
  findAll() {
    return this.ticketsSoporteService.getTickets();
  }

  @Get('/get-ticket-boleta/:id')
  getTicketToBoleta(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsSoporteService.getTicketToBoleta(id);
  }

  // ===== UPDATE (datos generales) =====
  @Patch('/update-ticket-soporte/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketsSoporteDto: UpdateTicketsSoporteDto,
  ) {
    return this.ticketsSoporteService.update(id, updateTicketsSoporteDto);
  }

  // ===== UPDATE (cambios de estado rápidos) =====
  @Patch('update-ticket-proceso/:id')
  async updateTicketProceso(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsSoporteService.updateStatusEnProceso(id);
  }

  @Patch('update-ticket-revision/:id')
  async updateTicketRevision(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsSoporteService.updateStatusEnRevision(id);
  }

  // ===== CLOSE =====
  @Patch('/close-ticket-soporte/:id')
  closeTickets(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseTicketDto,
  ) {
    return this.ticketsSoporteService.closeTickets(id, dto);
  }

  // ===== DELETE =====
  @Delete('/delete-ticket/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsSoporteService.delete(id);
  }

  @Delete('/delete-all')
  removeAll() {
    return this.ticketsSoporteService.removeAll();
  }
}
