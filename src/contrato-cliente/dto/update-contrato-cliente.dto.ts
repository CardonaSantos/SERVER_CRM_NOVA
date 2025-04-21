import { PartialType } from '@nestjs/mapped-types';
import { CreateContratoClienteDto } from './create-contrato-cliente.dto';
import { IsInt } from 'class-validator';

export class UpdateContratoClienteDto extends PartialType(
  CreateContratoClienteDto,
) {
  @IsInt()
  id: number;
}
