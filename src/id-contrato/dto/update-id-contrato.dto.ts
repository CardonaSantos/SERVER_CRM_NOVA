import { PartialType } from '@nestjs/swagger';
import { CreateIdContratoDto } from './create-id-contrato.dto';

export class UpdateIdContratoDto extends PartialType(CreateIdContratoDto) {}
