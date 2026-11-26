import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class IniciarClienteDesinstalacionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  contrasenaActual: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;
}
