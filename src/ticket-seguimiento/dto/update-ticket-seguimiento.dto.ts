import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketSeguimientoDto } from './create-ticket-seguimiento.dto';

export class UpdateTicketSeguimientoDto extends PartialType(CreateTicketSeguimientoDto) {}
