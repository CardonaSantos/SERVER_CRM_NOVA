import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MetricasTicketsService } from './metricas-tickets.service';
import { CreateMetricasTicketDto } from './dto/create-metricas-ticket.dto';
import { UpdateMetricasTicketDto } from './dto/update-metricas-ticket.dto';

@Controller('metricas-tickets')
export class MetricasTicketsController {
  constructor(private readonly metricasTicketsService: MetricasTicketsService) {}

  @Post()
  create(@Body() createMetricasTicketDto: CreateMetricasTicketDto) {
    return this.metricasTicketsService.create(createMetricasTicketDto);
  }

  @Get()
  findAll() {
    return this.metricasTicketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metricasTicketsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMetricasTicketDto: UpdateMetricasTicketDto) {
    return this.metricasTicketsService.update(+id, updateMetricasTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metricasTicketsService.remove(+id);
  }
}
