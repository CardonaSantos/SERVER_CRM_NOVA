import { PartialType } from '@nestjs/swagger';
import { CreateTicketSoporteConformidadDto } from './create-ticket-soporte-conformidad.dto';

export class UpdateTicketSoporteConformidadDto extends PartialType(CreateTicketSoporteConformidadDto) {}
