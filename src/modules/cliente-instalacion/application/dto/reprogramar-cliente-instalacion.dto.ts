import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReprogramarClienteInstalacionDto {
  @IsDateString()
  fechaProgramada: Date;

  @IsOptional()
  @IsString()
  motivo?: string | null;
}
