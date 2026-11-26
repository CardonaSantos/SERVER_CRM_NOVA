import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CompletarClienteInstalacionDto {
  @IsOptional()
  @IsString()
  resultado?: string | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsOptional()
  @IsDateString()
  fechaFinalizacion?: Date;

  /** Se ignora: la activación PPPoE es un paso aparte desde oficina. Se conserva para no romper a quien aún lo envía. */
  @IsOptional()
  @IsBoolean()
  activarServicio?: boolean;
}
