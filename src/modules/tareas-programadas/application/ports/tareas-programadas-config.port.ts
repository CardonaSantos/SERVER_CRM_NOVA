export const TAREAS_PROGRAMADAS_CONFIG = Symbol('TAREAS_PROGRAMADAS_CONFIG');

export type TareasProgramadasConfig = {
  /**
   * Interruptor global (`TAREAS_PROGRAMADAS_ACTIVAS=true`). Apagado, ninguna
   * tarea corre: es el valor por defecto para que una copia local no facture
   * ni envíe nada.
   */
  activas: boolean;
};
