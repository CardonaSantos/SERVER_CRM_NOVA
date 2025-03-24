import { PartialType } from '@nestjs/mapped-types';
import { CreateIdContratoDto } from './create-id-contrato.dto';

export class UpdateIdContratoDto extends PartialType(CreateIdContratoDto) {}
