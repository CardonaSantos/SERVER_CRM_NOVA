import { Inject, Injectable } from '@nestjs/common';
import { PlanInternetNoEncontradoError } from '../../domain/errors/servicio.errors';
import {
  PLAN_INTERNET_QUERY,
  PlanInternetQueryPort,
} from '../../domain/ports/plan-internet-query.port';
import { PlanInternetDetalle } from '../../domain/read-models/plan-internet-listado.read-model';

@Injectable()
export class ObtenerPlanInternetUseCase {
  constructor(
    @Inject(PLAN_INTERNET_QUERY)
    private readonly consulta: PlanInternetQueryPort,
  ) {}

  async execute(planId: number): Promise<PlanInternetDetalle> {
    const plan = await this.consulta.findDetail(planId);
    if (!plan) throw new PlanInternetNoEncontradoError();

    return plan;
  }
}
