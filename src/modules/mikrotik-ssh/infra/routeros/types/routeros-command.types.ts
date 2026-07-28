/**
 * Comando RouterOS listo para ser enviado al ejecutor SSH.
 *
 * comando:
 *   Puede contener información sensible. Solo debe permanecer
 *   en memoria durante la ejecución.
 *
 * comandoSanitizado:
 *   Puede almacenarse en pasos, operaciones y auditorías.
 */
export type ComandoRouterOsConstruido = Readonly<{
  comando: string;

  comandoSanitizado: string;
}>;
