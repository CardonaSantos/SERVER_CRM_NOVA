import {
  OpcionesUnidadDeTrabajo,
  UnidadDeTrabajoPort,
} from './unidad-de-trabajo.port';

/**
 * Unidad de trabajo para pruebas: ejecuta el trabajo tal cual y deja ver si
 * una llamada ocurrió dentro (`abierta`) y con qué opciones se abrió.
 */
export class UnidadDeTrabajoEnMemoria implements UnidadDeTrabajoPort {
  abierta = false;
  readonly aperturas: (OpcionesUnidadDeTrabajo | undefined)[] = [];

  async ejecutar<T>(
    trabajo: () => Promise<T>,
    opciones?: OpcionesUnidadDeTrabajo,
  ): Promise<T> {
    if (this.abierta) return trabajo();
    this.aperturas.push(opciones);
    this.abierta = true;
    try {
      return await trabajo();
    } finally {
      this.abierta = false;
    }
  }
}
