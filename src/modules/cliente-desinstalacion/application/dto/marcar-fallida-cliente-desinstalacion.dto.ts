import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';

export class MarcarFallidaClienteDesinstalacionDto {
  @IsOptional()
  @IsEnum(MotivoDesinstalacionCliente)
  motivo?: MotivoDesinstalacionCliente | null;

  @IsOptional()
  @IsString()
  resultado?: string | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsOptional()
  @IsDateString()
  fechaFinalizacion?: string;
}
