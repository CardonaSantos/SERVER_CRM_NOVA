import { Injectable } from '@nestjs/common';
import { CreateMetricasTicketDto } from './dto/create-metricas-ticket.dto';
import { UpdateMetricasTicketDto } from './dto/update-metricas-ticket.dto';

@Injectable()
export class MetricasTicketsService {
  create(createMetricasTicketDto: CreateMetricasTicketDto) {
    return 'This action adds a new metricasTicket';
  }

  findAll() {
    return `This action returns all metricasTickets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} metricasTicket`;
  }

  update(id: number, updateMetricasTicketDto: UpdateMetricasTicketDto) {
    return `This action updates a #${id} metricasTicket`;
  }

  remove(id: number) {
    return `This action removes a #${id} metricasTicket`;
  }
}
