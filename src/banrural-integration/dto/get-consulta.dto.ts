import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetConsultaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'clienteId debe ser numero entero' })
  clienteId?: number;

  @IsOptional()
  @IsString({ message: 'codigoUnico debe ser string' })
  codigoUnico?: string;
}
