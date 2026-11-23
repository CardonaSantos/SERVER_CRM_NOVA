import { PartialType } from '@nestjs/swagger';
import { CreateTicketResumenDto } from './create-ticket-resuman.dto';

export class UpdateTicketResumanDto extends PartialType(
  CreateTicketResumenDto,
) {}
