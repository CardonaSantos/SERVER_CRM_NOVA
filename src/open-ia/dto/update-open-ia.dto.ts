import { PartialType } from '@nestjs/mapped-types';
import { CreateOpenIaDto } from './create-open-ia.dto';

export class UpdateOpenIaDto extends PartialType(CreateOpenIaDto) {}
