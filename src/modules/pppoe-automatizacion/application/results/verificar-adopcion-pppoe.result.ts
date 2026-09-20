import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

export type EstadoRemotoAdopcionPppoe =
  | EstadoCuentaPppoe.ACTIVA
  | EstadoCuentaPppoe.SUSPENDIDA;

/**
 * Resultado seguro de comprobar una cuenta PPPoE
 * que ya existe en MikroTik antes de adoptarla.
 *
 * Nunca contiene la contraseña suministrada ni
 * la contraseña almacenada en RouterOS.
 */
export type VerificarAdopcionPppoeResult = {
  empresaId: number;

  clienteId: number;

  perfilHomologacionId: number;

  mikrotikRouterId: number;

  servicioInternetId: number;

  usuarioPppoe: string;

  /**
   * Indica si el usuario existe físicamente
   * dentro de /ppp secret.
   */
  encontrado: boolean;

  /**
   * null:
   * no se encontró el secret.
   *
   * false:
   * existe, pero la contraseña no coincide.
   *
   * true:
   * las credenciales fueron verificadas.
   */
  passwordCoincide: boolean | null;

  /**
   * Perfil que debería tener según
   * PppoePerfilHomologacion.
   */
  perfilEsperado: string;

  /**
   * Profile observado realmente en RouterOS.
   */
  perfilEncontrado: string | null;

  perfilCoincide: boolean | null;

  /**
   * Valor service observado en /ppp secret.
   *
   * Históricos pueden utilizar:
   *
   * - pppoe
   * - any
   *
   * Ambos son compatibles con PPPoE.
   */
  servicioEncontrado: string | null;

  servicioCompatible: boolean | null;

  /**
   * Estado disabled observado remotamente.
   *
   * false = habilitado
   * true  = suspendido/deshabilitado
   */
  deshabilitado: boolean | null;

  /**
   * Estado local que debería utilizarse
   * si posteriormente se adopta la cuenta.
   */
  estadoRemoto: EstadoRemotoAdopcionPppoe | null;

  /**
   * Solo se calcula cuando la contraseña ya fue
   * comprobada contra MikroTik.
   *
   * No bloquea la adopción.
   */
  cumpleFormatoNova: boolean | null;

  /**
   * true únicamente cuando:
   *
   * - existe el secret;
   * - la contraseña coincide;
   * - el profile coincide;
   * - service es compatible.
   */
  puedeAdoptar: boolean;

  /**
   * Observaciones no bloqueantes o motivos
   * por los que no puede adoptarse.
   */
  advertencias: string[];
};
