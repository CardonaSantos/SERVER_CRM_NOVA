import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SuspenderPppoeManualDto {
  /**
   * Identifica de forma única esta solicitud.
   *
   * Permite que un doble clic o reenvío HTTP no cree
   * dos operaciones ni repita comandos SSH.
   */
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  claveIdempotencia: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  contrasenaActual: string;

  /**
   * Razón administrativa de la suspensión.
   *
   * Es obligatoria porque formará parte de la
   * trazabilidad de PppoeOperacion y PppoeAuditoria.
   */
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  motivo: string;
}
