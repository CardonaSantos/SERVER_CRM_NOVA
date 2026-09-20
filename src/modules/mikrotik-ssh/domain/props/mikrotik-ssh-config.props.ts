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

  /**
   * Cantidad máxima de consultas utilizadas para confirmar
   * que una sesión PPPoE desapareció después de ejecutar:
   *
   * /ppp active remove [find name="..."]
   *
   * IMPORTANTE:
   *
   * Este valor controla únicamente consultas de confirmación.
   * El comando modificador de remoción se ejecuta una sola vez.
   *
   * Se mantiene opcional para preservar compatibilidad con
   * configuraciones, pruebas o mocks existentes.
   */
  activeSessionConfirmationMaxAttempts?: number;

  /**
   * Espera inicial, en milisegundos, antes de repetir una
   * consulta de confirmación cuando la sesión PPPoE todavía
   * aparece en /ppp active.
   *
   * La primera comprobación puede realizarse inmediatamente.
   * Las siguientes utilizarán backoff acotado.
   *
   * Este valor no retrasa operaciones cuando RouterOS refleja
   * el estado esperado en la primera consulta.
   */
  activeSessionConfirmationInitialDelayMs?: number;

  /**
   * Límite máximo, en milisegundos, para una espera individual
   * entre consultas de confirmación de una sesión PPPoE.
   *
   * Evita que el backoff crezca indefinidamente y mantiene
   * acotado el tiempo total de la operación.
   */
  activeSessionConfirmationMaxDelayMs?: number;
};

// /**
//  * Configuración operativa interna del módulo SSH.
//  *
//  * Se carga desde variables de entorno al iniciar NestJS.
//  */
// export type ConfiguracionMikrotikSsh = {
//   /**
//    * Tiempo máximo para completar conexión,
//    * handshake y autenticación.
//    */
//   readyTimeoutMs: number;

//   /**
//    * Tiempo máximo para ejecutar cada comando.
//    */
//   commandTimeoutMs: number;

//   /**
//    * Tiempo máximo para cerrar ordenadamente una sesión.
//    */
//   closeTimeoutMs: number;

//   /**
//    * Intervalo entre paquetes keepalive.
//    *
//    * Un valor 0 deshabilita el keepalive.
//    */
//   keepaliveIntervalMs: number;

//   /**
//    * Cantidad máxima de keepalive sin respuesta.
//    */
//   keepaliveCountMax: number;

//   /**
//    * Tamaño máximo acumulado de stdout y stderr.
//    */
//   maxOutputBytes: number;

//   /**
//    * Permite conectar sin verificar la huella del host.
//    *
//    * Debe permanecer false en producción.
//    */
//   permitirHostNoVerificado: boolean;
// };
