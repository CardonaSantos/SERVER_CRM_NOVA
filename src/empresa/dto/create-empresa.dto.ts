import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  pbx?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsUrl()
  sitioWeb?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsUrl()
  logo1?: string;

  @IsOptional()
  @IsUrl()
  logo2?: string;

  @IsOptional()
  @IsUrl()
  logo3?: string;
}
