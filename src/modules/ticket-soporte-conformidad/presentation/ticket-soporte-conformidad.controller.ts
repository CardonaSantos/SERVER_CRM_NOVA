import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateTicketSoporteConformidadDto } from '../application/dto/create-ticket-soporte-conformidad.dto';
import { TicketSoporteConformidadService } from '../application/services/ticket-soporte-conformidad.service';
import { UpdateTicketSoporteConformidadDto } from '../application/dto/update-ticket-soporte-conformidad.dto';

@Controller('ticket-soporte-conformidad')
export class TicketSoporteConformidadController {
  constructor(
    private readonly ticketSoporteConformidadService: TicketSoporteConformidadService,
  ) {}

  @Post()
  create(
    @Body()
    createTicketSoporteConformidadDto: CreateTicketSoporteConformidadDto,
  ) {
    return this.ticketSoporteConformidadService.create(
      createTicketSoporteConformidadDto,
    );
  }

  @Get()
  findAll() {
    return this.ticketSoporteConformidadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketSoporteConformidadService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateTicketSoporteConformidadDto: UpdateTicketSoporteConformidadDto,
  ) {
    return this.ticketSoporteConformidadService.update(
      +id,
      updateTicketSoporteConformidadDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketSoporteConformidadService.remove(+id);
  }
}
