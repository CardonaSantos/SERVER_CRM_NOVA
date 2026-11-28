export enum EstadoEjecucionTarea {
  EJECUTANDO = 'EJECUTANDO',
  COMPLETADA = 'COMPLETADA',
  /** Terminó, pero algunos elementos (clientes, mensajes) fallaron. */
  COMPLETADA_CON_ERRORES = 'COMPLETADA_CON_ERRORES',
  FALLIDA = 'FALLIDA',
}

export enum OrigenEjecucionTarea {
  PROGRAMADA = 'PROGRAMADA',
  MANUAL = 'MANUAL',
}

/** Qué se puede hacer con una ejecución que ya existe. */
export enum SituacionEjecucionTarea {
  COMPLETADA = 'COMPLETADA',
  /** Otra ejecución la tiene con el arriendo vigente. */
  EN_CURSO = 'EN_CURSO',
  /** Abandonada (arriendo vencido) o fallida con reintento disponible. */
  RETOMABLE = 'RETOMABLE',
  /** Fallida; su próximo reintento todavía no llega. */
  EN_ESPERA = 'EN_ESPERA',
  /** Fallida o abandonada sin intentos disponibles hoy. */
  AGOTADA = 'AGOTADA',
}
