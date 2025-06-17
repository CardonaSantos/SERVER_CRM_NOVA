import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MetasTicketsService } from './metas-tickets.service';
import { CreateMetasTicketDto } from './dto/create-metas-ticket.dto';
import { UpdateMetasTicketDto } from './dto/update-metas-ticket.dto';

@Controller('metas-tickets')
export class MetasTicketsController {
  constructor(private readonly metasTicketsService: MetasTicketsService) {}

  @Post()
  create(@Body() createMetasTicketDto: CreateMetasTicketDto) {
    return this.metasTicketsService.create(createMetasTicketDto);
  }

  @Get()
  findAll() {
    return this.metasTicketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metasTicketsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMetasTicketDto: UpdateMetasTicketDto) {
    return this.metasTicketsService.update(+id, updateMetasTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metasTicketsService.remove(+id);
  }
}
