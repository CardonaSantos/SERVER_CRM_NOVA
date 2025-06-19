import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketsSoporteService } from './tickets-soporte.service';
import { CreateTicketsSoporteDto } from './dto/create-tickets-soporte.dto';
import { UpdateTicketsSoporteDto } from './dto/update-tickets-soporte.dto';
import { CloseTicketDto } from './dto/CloseTicketDto .dto';
import { UpdateTicketStatusDto } from './dto/updateStatus';

@Controller('tickets-soporte')
export class TicketsSoporteController {
  constructor(private readonly ticketsSoporteService: TicketsSoporteService) {}

  @Post()
  create(@Body() createTicketsSoporteDto: CreateTicketsSoporteDto) {
    return this.ticketsSoporteService.create(createTicketsSoporteDto);
  }

  @Get()
  findAll() {
    return this.ticketsSoporteService.getTickets();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsSoporteService.findOne(+id);
  }

  @Get('/get-ticket-boleta/:id')
  getTicketToBoleta(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsSoporteService.getTicketToBoleta(id);
  }

  @Patch('/update-ticket-soporte/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketsSoporteDto: UpdateTicketsSoporteDto,
  ) {
    return this.ticketsSoporteService.update(id, updateTicketsSoporteDto);
  }

  /**
   * PATCH /tickets-soporte/update-status-ticket/:id
   * Body: { estado: EstadoTicketSoporte }
   */
  @Patch('update-status-ticket/:id')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsSoporteService.updateStatus(id, dto);
  }

  @Patch('/close-ticket-soporte/:id')
  closeTickets(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketsSoporteDto: CloseTicketDto,
  ) {
    return this.ticketsSoporteService.closeTickets(id, updateTicketsSoporteDto);
  }

  @Delete('/delete-all')
  removeAll() {
    return this.ticketsSoporteService.removeAll();
  }

  @Delete('/delete-ticket/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsSoporteService.delete(id);
  }
}
