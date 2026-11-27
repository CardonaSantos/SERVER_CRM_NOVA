import { Injectable } from '@nestjs/common';
import {
  ServicioFacadePort,
  VerificarPlanAsignableInput,
  VerificarServiciosAsignablesInput,
} from '../../public/servicio.facade.port';
import { VerificarPlanInternetUseCase } from '../use-cases/verificar-plan-internet.use-case';
import { VerificarServiciosAsignablesUseCase } from '../use-cases/verificar-servicios-asignables.use-case';

@Injectable()
export class ServicioFacade implements ServicioFacadePort {
  constructor(
    private readonly verificarPlan: VerificarPlanInternetUseCase,
    private readonly verificarServicios: VerificarServiciosAsignablesUseCase,
  ) {}

  verificarPlanAsignable(input: VerificarPlanAsignableInput): Promise<void> {
    return this.verificarPlan.execute({ ...input, paraAsignar: true });
  }

  verificarPlanVigente(planId: number): Promise<void> {
    return this.verificarPlan.execute({ planId, paraAsignar: false });
  }

  verificarServiciosAsignables(
    input: VerificarServiciosAsignablesInput,
  ): Promise<void> {
    return this.verificarServicios.execute(input);
  }
}
