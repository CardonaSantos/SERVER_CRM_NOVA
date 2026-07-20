import { IsDateString, IsOptional } from 'class-validator';
export class IniciarInstalacionClienteDto {
  @IsDateString()
  @IsOptional()
  fechaInicio?: Date;
}
