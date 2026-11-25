/**
 * Información técnica segura compartida por las acciones SSH.
 *
 * comandoSanitizado y respuestaSanitizada pueden persistirse
 * en PppoeOperacionPaso.
 */
export type ResultadoBaseMikrotikSsh = {
  duracionMs: number;

  /**
   * Representación segura del comando ejecutado.
   *
   * Nunca debe contener:
   *
   * - contraseña PPPoE;
   * - contraseña SSH;
   * - clave privada;
   * - passphrase.
   */
  comandoSanitizado: string;

  /**
   * Resumen semántico de la respuesta.
   *
   * No corresponde al stdout o stderr completo.
   */
  respuestaSanitizada: string;
};

/**
 * Estado seguro de un secret PPPoE encontrado en RouterOS.
 */
export type SecretMikrotikSnapshot = {
  usuarioPppoe: string;

  codigoPerfil: string | null;

  deshabilitado: boolean;

  servicio: string | null;

  comentario: string | null;
};

/**
 * Resumen de una sesión PPPoE activa.
 */
export type SesionActivaMikrotikSnapshot = {
  usuarioPppoe: string;

  direccionIp: string | null;

  tiempoActivo: string | null;
};
