import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CompletarClienteInstalacionDto {
  @IsInt()
  @Min(1)
  completadoPorId: number;

  @IsOptional()
  @IsString()
  resultado?: string | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsOptional()
  @IsDateString()
  fechaFinalizacion?: Date;

  @IsOptional()
  @IsBoolean()
  activarServicio?: boolean;
}
