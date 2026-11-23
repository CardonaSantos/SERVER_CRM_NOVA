import { PartialType } from '@nestjs/swagger';
import { CreateContratoClienteDto } from './create-contrato-cliente.dto';
import { IsInt } from 'class-validator';

export class UpdateContratoClienteDto extends PartialType(
  CreateContratoClienteDto,
) {
  @IsInt()
  id: number;
}
