import {
  BuscarSecretMikrotikParams,
  ConfirmarSecretMikrotikParams,
  CrearSecretMikrotikParams,
  GestionarSecretMikrotikParams,
  RemoverSesionActivaMikrotikParams,
  VerificarCredencialesSecretMikrotikParams,
} from '../props/mikrotik-ssh-secret.props';

import { SesionMikrotikSshInfo } from '../props/mikrotik-ssh-session.props';

import {
  BuscarSecretMikrotikResult,
  ConfirmarSecretMikrotikResult,
  CrearSecretMikrotikResult,
  GestionarSecretMikrotikResult,
  RemoverSesionActivaMikrotikResult,
  VerificarCredencialesSecretMikrotikResult,
} from '../results/mikrotik-ssh-secret.result';

/**
 * Sesión SSH abierta contra un router MikroTik.
 *
 * Permite ejecutar varias acciones secuenciales utilizando
 * una misma conexión.
 */
export interface MikrotikSshSessionPort {
  /**
   * Información segura de la sesión.
   *
   * No contiene credenciales ni objetos de ssh2.
   */
  obtenerInfo(): SesionMikrotikSshInfo;

  /**
   * Indica si la sesión todavía puede ejecutar comandos.
   */
  estaAbierta(): boolean;

  /**
   * Busca un secret PPPoE por nombre de usuario.
   */
  buscarSecret(
    params: BuscarSecretMikrotikParams,
  ): Promise<BuscarSecretMikrotikResult>;

  /**
   * Comprueba que un usuario y contraseña suministrados
   * correspondan a un secret PPPoE existente.
   *
   * Esta operación:
   *
   * - no crea el secret;
   * - no modifica el secret;
   * - no habilita ni deshabilita;
   * - nunca devuelve la contraseña almacenada en RouterOS.
   *
   * La comparación del password ocurre dentro de RouterOS.
   */
  verificarCredencialesSecret(
    params: VerificarCredencialesSecretMikrotikParams,
  ): Promise<VerificarCredencialesSecretMikrotikResult>;

  /**
   * Crea un secret PPPoE.
   *
   * El resultado solo confirma que RouterOS procesó
   * el comando. El cambio debe confirmarse posteriormente.
   */
  crearSecret(
    params: CrearSecretMikrotikParams,
  ): Promise<CrearSecretMikrotikResult>;

  /**
   * Habilita un secret PPPoE existente.
   */
  habilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult>;

  /**
   * Deshabilita un secret PPPoE existente.
   */
  deshabilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult>;

  /**
   * Remueve las sesiones PPPoE activas del usuario.
   */
  removerSesionActiva(
    params: RemoverSesionActivaMikrotikParams,
  ): Promise<RemoverSesionActivaMikrotikResult>;

  /**
   * Elimina un secret PPPoE.
   */
  eliminarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult>;

  /**
   * Comprueba el estado final esperado del secret.
   */
  confirmarSecret(
    params: ConfirmarSecretMikrotikParams,
  ): Promise<ConfirmarSecretMikrotikResult>;

  /**
   * Finaliza la conexión SSH.
   *
   * Debe ser seguro llamarlo más de una vez.
   */
  cerrar(): Promise<void>;
}
