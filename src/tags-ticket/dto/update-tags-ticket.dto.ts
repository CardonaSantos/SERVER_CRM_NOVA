import { PartialType } from '@nestjs/swagger';
import { CreateTagsTicketDto } from './create-tags-ticket.dto';

export class UpdateTagsTicketDto extends PartialType(CreateTagsTicketDto) {}
