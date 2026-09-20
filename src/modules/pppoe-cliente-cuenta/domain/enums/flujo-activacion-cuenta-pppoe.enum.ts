/**
 * Define qué orquestador debe utilizarse para realizar
 * la primera activación de una cuenta PPPoE.
 *
 * IMPORTANTE:
 *
 * Esto no representa el origen histórico de la cuenta.
 * Representa el flujo que debe ejecutar la UI cuando
 * acciones.activar.habilitada === true.
 */
export enum FlujoActivacionCuentaPppoe {
  /**
   * La cuenta nació dentro de ClienteInstalacion.
   *
   * La activación debe conservar el contexto de instalación:
   *
   * POST /cliente-instalaciones/:instalacionId/pppoe/activar
   */
  INSTALACION = 'INSTALACION',

  /**
   * La cuenta fue creada administrativamente fuera
   * del flujo de ClienteInstalacion.
   *
   * Debe utilizar:
   *
   * POST /pppoe-cuentas/:cuentaPppoeId/provisionar
   */
  ALTA_MANUAL = 'ALTA_MANUAL',
}
