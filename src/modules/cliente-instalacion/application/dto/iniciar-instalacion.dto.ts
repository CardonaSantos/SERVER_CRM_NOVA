import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class IniciarInstalacionClienteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  contrasenaActual: string;

  @IsDateString()
  @IsOptional()
  fechaInicio?: Date;
}
