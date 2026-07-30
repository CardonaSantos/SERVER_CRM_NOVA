import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class IniciarClienteDesinstalacionDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;
}
