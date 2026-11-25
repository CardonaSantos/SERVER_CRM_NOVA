export const UNIDAD_DE_TRABAJO = Symbol('UNIDAD_DE_TRABAJO');

export type OpcionesUnidadDeTrabajo = {
  /** SERIALIZABLE cuando dos ejecuciones concurrentes no deben pisarse. */
  aislamiento?: 'SERIALIZABLE';
};

/**
 * Ejecuta varias escrituras de uno o más módulos de forma atómica (estándar
 * §5.5). Dentro de `trabajo` se llaman fachadas o puertos como siempre: sus
 * repositorios usan la transacción abierta sin recibirla como parámetro.
 *
 * Si ya hay una unidad abierta, `trabajo` se une a ella (no se anida).
 * Prohibido hacer I/O remoto (SSH, Meta, Spaces) dentro de `trabajo`.
 */
export interface UnidadDeTrabajoPort {
  ejecutar<T>(
    trabajo: () => Promise<T>,
    opciones?: OpcionesUnidadDeTrabajo,
  ): Promise<T>;
}
