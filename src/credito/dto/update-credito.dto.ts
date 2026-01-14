import { PartialType } from '@nestjs/mapped-types';
import { CrearCreditoDto } from './create-credito.dto';

export class UpdateCreditoDto extends PartialType(CrearCreditoDto) {}
