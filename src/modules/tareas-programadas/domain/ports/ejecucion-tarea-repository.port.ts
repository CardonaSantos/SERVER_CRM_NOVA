import { EjecucionTareaEntity } from '../entities/ejecucion-tarea.entity';

export const EJECUCION_TAREA_REPOSITORY = Symbol('EJECUCION_TAREA_REPOSITORY');

/** Versión que se espera encontrar al escribir: si cambió, otro la retomó. */
export type VersionEjecucionTarea = {
  estado: EjecucionTareaEntity['estado'];
  intentos: number;
};

export interface EjecucionTareaRepositoryPort {
  findByClave(clave: string): Promise<EjecucionTareaEntity | null>;

  /**
   * Inserta una ejecución nueva. Devuelve `null` si la clave ya existe (otra
   * ejecución llegó primero); nunca duplica.
   */
  crear(ejecucion: EjecucionTareaEntity): Promise<EjecucionTareaEntity | null>;

  /**
   * Guarda la retoma solo si la fila sigue en `anterior` (estado e intentos)
   * y, si estaba en ejecución, con el arriendo vencido. `false` si otra
   * ejecución la tomó antes.
   */
  retomar(
    ejecucion: EjecucionTareaEntity,
    anterior: VersionEjecucionTarea,
    ahora: Date,
  ): Promise<boolean>;

  /**
   * Alarga el arriendo de una ejecución que sigue siendo de quien la tiene
   * (misma versión, en ejecución). `false` si ya no lo es.
   */
  renovarArriendo(ejecucion: EjecucionTareaEntity): Promise<boolean>;

  /**
   * Guarda el resultado (completada o fallida) si quien termina todavía la
   * tiene. `false` si otra ejecución la retomó mientras tanto.
   */
  finalizar(ejecucion: EjecucionTareaEntity): Promise<boolean>;

  /**
   * Borra las ejecuciones de fechas operativas anteriores a `fecha`
   * (`YYYY-MM-DD`, sin incluirla). Devuelve cuántas borró.
   */
  borrarAnterioresA(fecha: string): Promise<number>;
}
