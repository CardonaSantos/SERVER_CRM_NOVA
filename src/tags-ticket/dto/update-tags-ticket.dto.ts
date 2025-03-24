import { PartialType } from '@nestjs/mapped-types';
import { CreateTagsTicketDto } from './create-tags-ticket.dto';

export class UpdateTagsTicketDto extends PartialType(CreateTagsTicketDto) {}
