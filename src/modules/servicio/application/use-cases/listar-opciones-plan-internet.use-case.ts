import { Inject, Injectable } from '@nestjs/common';
import {
  PLAN_INTERNET_QUERY,
  PlanInternetQueryPort,
} from '../../domain/ports/plan-internet-query.port';
import { PlanInternetOpcion } from '../../domain/read-models/plan-internet-listado.read-model';

@Injectable()
export class ListarOpcionesPlanInternetUseCase {
  constructor(
    @Inject(PLAN_INTERNET_QUERY)
    private readonly consulta: PlanInternetQueryPort,
  ) {}

  execute(): Promise<PlanInternetOpcion[]> {
    return this.consulta.findOpciones();
  }
}
