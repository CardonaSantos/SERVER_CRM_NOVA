import { PartialType } from '@nestjs/swagger';
import { CreateFireworksIaDto } from './create-fireworks-ia.dto';

export class UpdateFireworksIaDto extends PartialType(CreateFireworksIaDto) {}
