// create-empresa.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  pbx?: string;

  @IsString()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsOptional()
  sitioWeb?: string;

  @IsString()
  @IsOptional()
  nit?: string;
}
