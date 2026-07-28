/**
 * Configuración operativa interna del módulo SSH.
 *
 * Se carga desde variables de entorno al iniciar NestJS.
 */
export type ConfiguracionMikrotikSsh = {
  /**
   * Tiempo máximo para completar conexión,
   * handshake y autenticación.
   */
  readyTimeoutMs: number;

  /**
   * Tiempo máximo para ejecutar cada comando.
   */
  commandTimeoutMs: number;

  /**
   * Tiempo máximo para cerrar ordenadamente una sesión.
   */
  closeTimeoutMs: number;

  /**
   * Intervalo entre paquetes keepalive.
   *
   * Un valor 0 deshabilita el keepalive.
   */
  keepaliveIntervalMs: number;

  /**
   * Cantidad máxima de keepalive sin respuesta.
   */
  keepaliveCountMax: number;

  /**
   * Tamaño máximo acumulado de stdout y stderr.
   */
  maxOutputBytes: number;

  /**
   * Permite conectar sin verificar la huella del host.
   *
   * Debe permanecer false en producción.
   */
  permitirHostNoVerificado: boolean;
};
