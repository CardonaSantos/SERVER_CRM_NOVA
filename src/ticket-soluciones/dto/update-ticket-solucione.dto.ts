import { PartialType } from '@nestjs/swagger';
import { CreateTicketSolucioneDto } from './create-ticket-solucione.dto';

export class UpdateTicketSolucioneDto extends PartialType(CreateTicketSolucioneDto) {}
