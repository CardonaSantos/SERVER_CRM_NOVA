import { Injectable } from '@nestjs/common';

import { EjecucionTareaInvalidaError } from '../../domain/errors/tareas-programadas.errors';
import { TareaManualDisponible } from '../../domain/read-models/ejecucion-tarea-listado.read-model';
import { RegistrarTareaManualInput } from '../../public/tareas-programadas.facade.port';

const NOMBRE_TAREA = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/**
 * Tareas que los módulos permiten lanzar a mano (solo las que se pueden
 * repetir sin efectos dobles). En memoria: cada instancia registra las
 * mismas al arrancar.
 */
@Injectable()
export class RegistroTareasManualesService {
  private readonly tareas = new Map<string, RegistrarTareaManualInput>();

  registrar(tarea: RegistrarTareaManualInput): void {
    if (!NOMBRE_TAREA.test(tarea.tarea)) {
      throw new EjecucionTareaInvalidaError(
        'El nombre de la tarea debe ir en mayúsculas y guiones bajos.',
      );
    }
    if (this.tareas.has(tarea.tarea)) {
      throw new EjecucionTareaInvalidaError(
        'La tarea manual ya está registrada.',
      );
    }
    this.tareas.set(tarea.tarea, { ...tarea });
  }

  buscar(tarea: string): RegistrarTareaManualInput | null {
    return this.tareas.get(tarea) ?? null;
  }

  /** Por nombre, para la pantalla. */
  disponibles(): TareaManualDisponible[] {
    return [...this.tareas.values()]
      .map(({ tarea, descripcion }) => ({ tarea, descripcion }))
      .sort((a, b) => a.tarea.localeCompare(b.tarea));
  }
}
