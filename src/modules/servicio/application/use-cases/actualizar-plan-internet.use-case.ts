import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { PlanInternetEntity } from '../../domain/entities/plan-internet.entity';
import {
  PlanInternetNoEncontradoError,
  PlanInternetNombreDuplicadoError,
} from '../../domain/errors/servicio.errors';
import { mismoNombre } from '../../domain/policies/catalogo.policy';
import {
  PLAN_INTERNET_REPOSITORY,
  PlanInternetRepositoryPort,
} from '../../domain/ports/plan-internet-repository.port';
import { ActualizarPlanInternetProps } from '../../domain/props/plan-internet.props';

export type ActualizarPlanInternetInput = {
  planId: number;
  usuarioId: number;
  cambios: ActualizarPlanInternetProps;
};

/**
 * Cambia nombre, velocidad o estado: lo que no llega no cambia. Los nombres que
 * ya estaban repetidos se pueden seguir editando mientras no se cambien.
 */
@Injectable()
export class ActualizarPlanInternetUseCase {
  private readonly logger = new Logger(ActualizarPlanInternetUseCase.name);

  constructor(
    @Inject(PLAN_INTERNET_REPOSITORY)
    private readonly planes: PlanInternetRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ActualizarPlanInternetInput,
  ): Promise<PlanInternetEntity> {
    const guardado = await this.unidad.ejecutar(async () => {
      await this.planes.bloquearParaModificar(input.planId);
      const plan = await this.planes.findById(input.planId);
      if (!plan) throw new PlanInternetNoEncontradoError();

      const nombreAnterior = plan.nombre;
      plan.actualizar(input.cambios, this.reloj.ahora());

      if (!mismoNombre(plan.nombre, nombreAnterior)) {
        await this.planes.bloquearNombres();
        if (await this.planes.existeNombre(plan.nombre, input.planId)) {
          throw new PlanInternetNombreDuplicadoError();
        }
      }

      return this.planes.update(plan);
    });

    this.logger.log(
      `Plan ${input.planId} actualizado por el usuario ${input.usuarioId}.`,
    );

    return guardado;
  }
}
