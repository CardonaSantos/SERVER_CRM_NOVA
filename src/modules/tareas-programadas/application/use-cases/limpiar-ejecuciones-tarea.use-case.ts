import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  EJECUCION_TAREA_REPOSITORY,
  EjecucionTareaRepositoryPort,
} from '../../domain/ports/ejecucion-tarea-repository.port';
import {
  RETENCION_EJECUCIONES_DIAS,
  restarDias,
} from '../../domain/policies/retencion.policy';

export type LimpiarEjecucionesTareaResult = {
  /** Se borró lo anterior a esta fecha (`YYYY-MM-DD`). */
  anterioresA: string;
  borradas: number;
};

/** Borra del registro las ejecuciones de hace más de 180 días. */
@Injectable()
export class LimpiarEjecucionesTareaUseCase {
  constructor(
    @Inject(EJECUCION_TAREA_REPOSITORY)
    private readonly ejecuciones: EjecucionTareaRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<LimpiarEjecucionesTareaResult> {
    const anterioresA = restarDias(
      this.reloj.fechaOperativa(),
      RETENCION_EJECUCIONES_DIAS,
    );
    const borradas = await this.ejecuciones.borrarAnterioresA(anterioresA);
    return { anterioresA, borradas };
  }
}
