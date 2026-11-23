import { PartialType } from '@nestjs/swagger';
import { CrearCreditoDto } from './create-credito.dto';

export class UpdateCreditoDto extends PartialType(CrearCreditoDto) {}
