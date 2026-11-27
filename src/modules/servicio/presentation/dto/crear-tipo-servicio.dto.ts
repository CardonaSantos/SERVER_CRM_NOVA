import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CrearTipoServicioDto {
  /** Nombre; único */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  /** Descripción */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
