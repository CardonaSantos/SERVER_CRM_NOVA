import { PartialType } from '@nestjs/mapped-types';
import { CreateMetricasTicketDto } from './create-metricas-ticket.dto';

export class UpdateMetricasTicketDto extends PartialType(CreateMetricasTicketDto) {}
