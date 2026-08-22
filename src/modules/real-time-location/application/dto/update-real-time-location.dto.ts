import { PartialType } from '@nestjs/mapped-types';
import { CreateRealTimeLocationDto } from './create-real-time-location.dto';

export class UpdateRealTimeLocationDto extends PartialType(CreateRealTimeLocationDto) {}
