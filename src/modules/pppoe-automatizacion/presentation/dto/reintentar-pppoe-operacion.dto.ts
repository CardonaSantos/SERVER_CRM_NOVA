import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Solicita un nuevo intento sobre una operación
 * PPPoE FALLIDA o PARCIAL.
 *
 * La empresa y el operador se obtienen
 * exclusivamente del JWT.
 */
export class ReintentarPppoeOperacionDto {
  /**
   * Debe identificar de forma única este nuevo intento.
   *
   * No puede reutilizarse la clave del intento anterior.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  claveIdempotencia: string;

  /**
   * Motivo administrativo del nuevo intento.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  motivo?: string;

  /**
   * Contraseña actual del operador.
   *
   * Es opcional a nivel HTTP porque no todas las
   * operaciones PPPoE necesitan una nueva
   * reautenticación para reintentarse.
   *
   * Sin embargo, será obligatoria cuando el
   * reintento pertenezca a una BAJA MANUAL:
   *
   * ELIMINAR_SECRET
   * + instalacionId = null
   * + desinstalacionId = null
   *
   * Nunca debe propagarse al motor PPPoE.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  contrasenaActual?: string;
}
