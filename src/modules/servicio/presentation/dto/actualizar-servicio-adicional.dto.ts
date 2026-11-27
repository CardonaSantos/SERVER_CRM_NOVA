import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

/** Todos los campos son opcionales: lo que no llega no cambia. */
export class ActualizarServicioAdicionalDto {
  /** Nombre */
  @ValidateIf((_, valor) => valor !== undefined)
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  /** Descripción; `null` o vacío la quitan */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  /** Precio: 0 o mayor, hasta 2 decimales */
  @ValidateIf((_, valor) => valor !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio?: number;

  /** `INACTIVO` deja de ofrecerlo; quien ya lo tiene lo conserva */
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEnum(EstadoServicio)
  estado?: EstadoServicio;

  /** Tipo de servicio; `null` lo quita */
  @IsOptional()
  @IsInt()
  @Min(1)
  tipoServicioId?: number | null;
}
