import { PartialType } from '@nestjs/mapped-types';
import { CreateContratoDto } from './create-contrato.dto';

export class UpdateContratoDto extends PartialType(CreateContratoDto) {}
