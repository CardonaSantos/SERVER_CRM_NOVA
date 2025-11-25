import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketSolucioneDto } from './create-ticket-solucione.dto';

export class UpdateTicketSolucioneDto extends PartialType(CreateTicketSolucioneDto) {}
