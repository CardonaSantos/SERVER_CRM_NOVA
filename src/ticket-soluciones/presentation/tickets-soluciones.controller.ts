// presentation/ticket-soluciones.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Delete,
  Patch,
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
    return await this.ticketSolucionesService.getAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketSolucionesService.getById(id);
  }
   @Delete(':id',)
  async deleteById(@Param('id',  ParseIntPipe)id:number) {
    return await this.ticketSolucionesService.deleteById(id)

  }

  //DELETE
  @Delete('')
  async findAll() {
    return this.ticketSolucionesService.deleteAll();
  }

  // PATCH
  @Patch('')
  async update(
    // @Param('id', ParseIntPipe) id:number,
    @Body() dto: CreateTicketSolucioneDto
  ) {
    const id = dto.id
    return this.ticketSolucionesService.update(id, dto);
  }
 
}
