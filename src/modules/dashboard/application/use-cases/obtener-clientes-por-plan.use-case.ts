import { Inject, Injectable } from '@nestjs/common';
import { clientesPorPlan } from '../../domain/policies/cartera.policy';
import {
  CARTERA_QUERY,
  CarteraQueryPort,
} from '../../domain/ports/cartera-query.port';
import { ClientesPorPlanReadModel } from '../../domain/read-models/cartera.read-model';

@Injectable()
export class ObtenerClientesPorPlanUseCase {
  constructor(
    @Inject(CARTERA_QUERY) private readonly cartera: CarteraQueryPort,
  ) {}

  async execute(): Promise<ClientesPorPlanReadModel> {
    return clientesPorPlan(await this.cartera.findClientesConPlan());
  }
}
