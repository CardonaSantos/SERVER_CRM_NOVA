import { Inject, Injectable } from '@nestjs/common';
import {
  PlanInternetInactivoError,
  PlanInternetNoEncontradoError,
} from '../../domain/errors/servicio.errors';
import {
  PLAN_INTERNET_REPOSITORY,
  PlanInternetRepositoryPort,
} from '../../domain/ports/plan-internet-repository.port';

export type VerificarPlanInternetInput = {
  planId: number;
  /** `true` cuando la referencia es una asignación y no un dato histórico. */
  paraAsignar: boolean;
  clienteId?: number;
};

/**
 * Confirma que un plan puede referenciarse y, dentro de una unidad de trabajo,
 * impide que se elimine hasta que esta termine.
 */
@Injectable()
export class VerificarPlanInternetUseCase {
  constructor(
    @Inject(PLAN_INTERNET_REPOSITORY)
    private readonly planes: PlanInternetRepositoryPort,
  ) {}

  async execute(input: VerificarPlanInternetInput): Promise<void> {
    await this.planes.bloquearParaAsignar(input.planId);
    const plan = await this.planes.findById(input.planId);
    if (!plan) throw new PlanInternetNoEncontradoError();
    plan.asegurarVigente();

    if (!input.paraAsignar || plan.activo) return;

    const yaLoTiene =
      input.clienteId !== undefined &&
      (await this.planes.clienteTienePlan(input.planId, input.clienteId));
    if (!yaLoTiene) throw new PlanInternetInactivoError();
  }
}
