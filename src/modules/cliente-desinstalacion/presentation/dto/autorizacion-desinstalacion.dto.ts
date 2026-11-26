import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AprobarDesinstalacionAutorizacionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  contrasenaActual: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentarioAutorizador?: string | null;
}

export class RechazarDesinstalacionAutorizacionDto {
  @IsOptional()
  @IsString()
  comentarioAutorizador?: string | null;
}

export class SolicitarDesinstalacionAutorizacionDto {
  @IsOptional()
  @IsString()
  motivoSolicitud?: string | null;
}
