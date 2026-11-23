import { PartialType } from '@nestjs/swagger';
import { CreateBroadcastDto } from './create-broadcast.dto';

export class UpdateBroadcastDto extends PartialType(CreateBroadcastDto) {}
