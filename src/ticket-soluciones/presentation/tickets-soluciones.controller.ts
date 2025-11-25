// presentation/ticket-soluciones.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { CreateTicketSolucioneDto } from '../dto/create-ticket-solucione.dto';
import { TicketSolucionesService } from '../app/ticket-soluciones.service';
import { SolucionTicket } from '../domain/ticket-soluciones.entity';

@Controller('ticket-soluciones')
export class TicketSolucionesController {
  constructor(
    private readonly ticketSolucionesService: TicketSolucionesService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTicketSolucioneDto): Promise<SolucionTicket> {
    return this.ticketSolucionesService.createSolucionTicket(dto);
  }

  //GET
  @Get('')
  async getAll() {
    return this.ticketSolucionesService.getAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketSolucionesService.getById(id);
  }

  //DELETE
  @Delete('')
  async findAll() {
    return this.ticketSolucionesService.deleteAll();
  }
}
