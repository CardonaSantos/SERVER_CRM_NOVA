import { PartialType } from '@nestjs/swagger';
import { CreateMetricasTicketDto } from './create-metricas-ticket.dto';

export class UpdateMetricasTicketDto extends PartialType(CreateMetricasTicketDto) {}
