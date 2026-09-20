import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketSoporteConformidadDto } from './create-ticket-soporte-conformidad.dto';

export class UpdateTicketSoporteConformidadDto extends PartialType(CreateTicketSoporteConformidadDto) {}
