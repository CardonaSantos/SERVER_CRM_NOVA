import { PartialType } from '@nestjs/swagger';
import { CreateOpenIaDto } from './create-open-ia.dto';

export class UpdateOpenIaDto extends PartialType(CreateOpenIaDto) {}
