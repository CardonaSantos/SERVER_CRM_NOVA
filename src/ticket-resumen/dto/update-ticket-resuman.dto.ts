import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketResumenDto } from './create-ticket-resuman.dto';

export class UpdateTicketResumanDto extends PartialType(
  CreateTicketResumenDto,
) {}
