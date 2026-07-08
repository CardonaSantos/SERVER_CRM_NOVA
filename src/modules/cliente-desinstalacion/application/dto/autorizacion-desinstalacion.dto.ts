import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AprobarDesinstalacionAutorizacionDto {
  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsInt()
  @Min(1)
  solicitadoPorId?: number;
}
