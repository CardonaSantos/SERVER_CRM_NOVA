import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Datos administrativos necesarios para dar
 * de baja definitivamente una cuenta PPPoE.
 *
 * No se reciben desde el body:
 *
 * - empresaId;
 * - cuentaPppoeId;
 * - operadorId;
 * - claveIdempotencia;
 * - instalacionId;
 * - desinstalacionId.
 *
 * La empresa y el operador provienen del JWT.
 * La cuenta proviene del parámetro de ruta.
 * La idempotencia se genera en backend.
 */
export class DarDeBajaPppoeManualDto {
  /**
   * Contraseña actual del operador autenticado.
   *
   * Se utiliza únicamente para reautenticación
   * administrativa antes de ejecutar la baja.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  contrasenaActual: string;

  /**
   * Justificación administrativa de la baja.
   *
   * Quedará asociada a la PppoeOperacion
   * para conservar trazabilidad.
   */
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  motivo: string;
}
