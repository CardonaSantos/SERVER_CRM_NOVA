import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Datos administrativos necesarios para ejecutar
 * la primera provisión de una cuenta PPPoE.
 *
 * No se reciben desde el body:
 *
 * - empresaId;
 * - cuentaPppoeId;
 * - operadorId;
 * - claveIdempotencia.
 *
 * La empresa y el operador provienen del JWT.
 * La cuenta proviene del parámetro de ruta.
 * Las claves de idempotencia se generan
 * determinísticamente en el servidor.
 */
export class ProvisionarPppoeClienteManualDto {
  /**
   * Contraseña actual del operador autenticado.
   *
   * Se utiliza únicamente para reautenticar la
   * acción administrativa antes de modificar MikroTik.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  contrasenaActual: string;

  /**
   * Motivo administrativo opcional.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  motivo?: string;
}
