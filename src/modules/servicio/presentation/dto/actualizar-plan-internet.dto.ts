import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

/** Todos los campos son opcionales: lo que no llega no cambia. */
export class ActualizarPlanInternetDto {
  /** Nombre del plan */
  @ValidateIf((_, valor) => valor !== undefined)
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  /** Velocidad anunciada; `null` o vacío la quitan */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  velocidad?: string | null;

  /** `INACTIVO` deja de ofrecerlo; quien ya lo tiene lo conserva */
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEnum(EstadoServicio)
  estado?: EstadoServicio;
}
