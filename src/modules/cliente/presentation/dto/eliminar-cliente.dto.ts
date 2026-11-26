import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo opcional de la eliminación de un cliente. */
export class EliminarClienteDto {
  /** Por qué se elimina */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;

  /** Detalle adicional */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
