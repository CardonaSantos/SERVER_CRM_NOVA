import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CompletarClienteDesinstalacionDto {
  @IsInt()
  @Min(1)
  ejecutadoPorId: number;

  @IsOptional()
  @IsString()
  resultado?: string | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsOptional()
  @IsDateString()
  fechaFinalizacion?: string;

  @IsOptional()
  @IsBoolean()
  equipoRecuperado?: boolean;

  @IsOptional()
  @IsBoolean()
  conforme?: boolean | null;
}
