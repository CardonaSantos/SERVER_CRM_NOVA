import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Comprueba si una cuenta PPPoE que ya existe
 * físicamente en MikroTik puede ser adoptada.
 *
 * No se reciben desde el body:
 *
 * - empresaId;
 * - operadorId;
 * - routerId;
 * - servicioInternetId.
 *
 * empresaId y operadorId provienen del JWT.
 *
 * routerId y servicioInternetId se resuelven mediante
 * perfilHomologacionId.
 */
export class VerificarAdopcionPppoeDto {
  /**
   * Cliente del CRM al que se desea asociar
   * la cuenta PPPoE existente.
   */
  @IsInt()
  @Min(1)
  clienteId: number;

  /**
   * Homologación que determina:
   *
   * - MikroTik;
   * - servicio;
   * - profile esperado.
   */
  @IsInt()
  @Min(1)
  perfilHomologacionId: number;

  /**
   * Usuario exacto existente en /ppp secret.
   *
   * No se deriva del clienteId.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^\S+$/, {
    message: 'usuarioPppoe no puede contener espacios.',
  })
  usuarioPppoe: string;

  /**
   * Contraseña exacta actualmente configurada
   * en MikroTik.
   *
   * IMPORTANTE:
   *
   * - no se transforma;
   * - no se trimmea;
   * - puede ser histórica;
   * - no necesita cumplir el formato NOVA actual.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  passwordPppoe: string;
}

/**
 * Ejecuta la adopción definitiva.
 *
 * Aunque previamente se haya llamado al endpoint
 * de verificación, el caso de uso volverá a comprobar
 * estas credenciales contra MikroTik antes de persistir.
 */
export class AdoptarCuentaPppoeExistenteDto {
  @IsInt()
  @Min(1)
  clienteId: number;

  @IsInt()
  @Min(1)
  perfilHomologacionId: number;

  /**
   * Usuario PPPoE existente.
   *
   * Es libre respecto al clienteId.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^\S+$/, {
    message: 'usuarioPppoe no puede contener espacios.',
  })
  usuarioPppoe: string;

  /**
   * Contraseña exacta del secret existente.
   *
   * No utilizar @Transform(trim) aquí.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  passwordPppoe: string;
}
