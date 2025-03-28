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
import { TicketsSoporteService } from './tickets-soporte.service';
import { CreateTicketsSoporteDto } from './dto/create-tickets-soporte.dto';
import { UpdateTicketsSoporteDto } from './dto/update-tickets-soporte.dto';

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

  @Patch('/update-ticket-soporte/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketsSoporteDto: UpdateTicketsSoporteDto,
  ) {
    return this.ticketsSoporteService.update(id, updateTicketsSoporteDto);
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
