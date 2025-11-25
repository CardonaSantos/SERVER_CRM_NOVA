import { PartialType } from '@nestjs/mapped-types';
import { CreateFireworksIaDto } from './create-fireworks-ia.dto';

export class UpdateFireworksIaDto extends PartialType(CreateFireworksIaDto) {}
