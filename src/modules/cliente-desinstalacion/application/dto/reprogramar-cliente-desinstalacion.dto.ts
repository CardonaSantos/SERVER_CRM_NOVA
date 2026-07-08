import { IsDateString, IsOptional, IsString } from 'class-validator';
import { IsEnum } from 'class-validator';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';

export class ReprogramarClienteDesinstalacionDto {
  @IsDateString()
  fechaProgramada: string;

  @IsOptional()
  @IsEnum(MotivoDesinstalacionCliente)
  motivo?: MotivoDesinstalacionCliente | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
