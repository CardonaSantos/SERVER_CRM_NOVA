import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  PlanInternetEnUsoError,
  PlanInternetNoEncontradoError,
} from '../../domain/errors/servicio.errors';
import {
  PLAN_INTERNET_REPOSITORY,
  PlanInternetRepositoryPort,
} from '../../domain/ports/plan-internet-repository.port';

export type EliminarPlanInternetInput = {
  planId: number;
  usuarioId: number;
};

export type EliminarPlanInternetResult = {
  planId: number;
  eliminadoEn: Date;
};

/**
 * Borrado lógico de un plan que nunca se usó. Con cualquier cliente (también
 * eliminado), acceso, instalación, desinstalación u homologación no se elimina:
 * se desactiva. La fila nunca se borra.
 */
@Injectable()
export class EliminarPlanInternetUseCase {
  private readonly logger = new Logger(EliminarPlanInternetUseCase.name);

  constructor(
    @Inject(PLAN_INTERNET_REPOSITORY)
    private readonly planes: PlanInternetRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EliminarPlanInternetInput,
  ): Promise<EliminarPlanInternetResult> {
    const ahora = this.reloj.ahora();

    await this.unidad.ejecutar(async () => {
      // El bloqueo espera a quien lo esté asignando; el conteo ya lo ve.
      await this.planes.bloquearParaModificar(input.planId);
      const plan = await this.planes.findById(input.planId);
      if (!plan) throw new PlanInternetNoEncontradoError();
      plan.asegurarVigente();

      const uso = await this.planes.contarUso(input.planId);
      if (Object.values(uso).some((cantidad) => cantidad > 0)) {
        throw new PlanInternetEnUsoError(uso);
      }

      plan.eliminar(input.usuarioId, ahora);
      await this.planes.eliminar(plan);
    });

    this.logger.log(
      `Plan ${input.planId} eliminado por el usuario ${input.usuarioId}.`,
    );

    return { planId: input.planId, eliminadoEn: ahora };
  }
}
