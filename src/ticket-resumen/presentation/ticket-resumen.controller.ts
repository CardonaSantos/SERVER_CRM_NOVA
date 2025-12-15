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
import { TicketResumenService } from '../app/ticket-resumen.service';
import { CreateTicketResumenDto } from '../dto/create-ticket-resuman.dto';
import { UpdateTicketResumanDto } from '../dto/update-ticket-resuman.dto';

@Controller('ticket-resumen')
export class TicketResumenController {
  constructor(private readonly ticketResumenService: TicketResumenService) {}

  @Post()
  create(@Body() createTicketResumanDto: CreateTicketResumenDto) {
    return this.ticketResumenService.create(createTicketResumanDto);
  }

  @Get()
  findAll() {
    return this.ticketResumenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketResumenService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketResumanDto: UpdateTicketResumanDto,
  ) {
    return this.ticketResumenService.update(id, updateTicketResumanDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketResumenService.remove(id);
  }
}
