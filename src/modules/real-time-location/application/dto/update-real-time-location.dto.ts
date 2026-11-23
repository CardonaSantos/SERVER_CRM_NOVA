import { PartialType } from '@nestjs/swagger';
import { CreateRealTimeLocationDto } from './create-real-time-location.dto';

export class UpdateRealTimeLocationDto extends PartialType(CreateRealTimeLocationDto) {}
