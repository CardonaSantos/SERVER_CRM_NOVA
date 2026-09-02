import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/*
 * =========================================================
 * REGISTER PUSH DEVICE
 * =========================================================
 *
 * Deliberadamente NO recibimos:
 *
 * - usuarioId;
 * - empresaId;
 * - proveedor;
 * - plataforma.
 *
 * usuarioId:
 *   sale exclusivamente del JWT autenticado.
 *
 * proveedor/plataforma:
 *   por ahora el Server controla FCM + ANDROID.
 * =========================================================
 */

export class RegisterPushDispositivoDto {
  /**
   * Identificador estable generado por la instalación
   * de NOVA.
   *
   * No es el FCM token.
   *
   * Se conservará en SecureStore y nos permitirá reconocer
   * la misma instalación aunque Firebase rote el token.
   */
  @IsUUID('4')
  instalacionId: string;

  /**
   * Token nativo FCM.
   *
   * Nunca debe imprimirse completo en logs.
   */
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombreDispositivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  modeloDispositivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  versionApp?: string;
}

/*
 * =========================================================
 * REVOKE PUSH DEVICE
 * =========================================================
 *
 * Para logout no necesitamos que Android vuelva a mandar
 * el token FCM.
 *
 * La instalación estable es suficiente.
 * =========================================================
 */

export class RevokePushDispositivoDto {
  @IsUUID('4')
  instalacionId: string;
}
