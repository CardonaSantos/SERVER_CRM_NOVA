import { PartialType } from '@nestjs/swagger';
import { CreateTicketSeguimientoDto } from './create-ticket-seguimiento.dto';

export class UpdateTicketSeguimientoDto extends PartialType(CreateTicketSeguimientoDto) {}
