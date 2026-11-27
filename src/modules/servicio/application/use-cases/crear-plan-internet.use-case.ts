import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { PlanInternetEntity } from '../../domain/entities/plan-internet.entity';
import { PlanInternetNombreDuplicadoError } from '../../domain/errors/servicio.errors';
import {
  PLAN_INTERNET_REPOSITORY,
  PlanInternetRepositoryPort,
} from '../../domain/ports/plan-internet-repository.port';
import { CrearPlanInternetProps } from '../../domain/props/plan-internet.props';

export type CrearPlanInternetInput = CrearPlanInternetProps & {
  usuarioId: number;
};

/** Un plan nace activo y con un nombre que no usa otro plan vigente. */
@Injectable()
export class CrearPlanInternetUseCase {
  private readonly logger = new Logger(CrearPlanInternetUseCase.name);

  constructor(
    @Inject(PLAN_INTERNET_REPOSITORY)
    private readonly planes: PlanInternetRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearPlanInternetInput): Promise<PlanInternetEntity> {
    const nuevo = PlanInternetEntity.create(input, this.reloj.ahora());

    const creado = await this.unidad.ejecutar(async () => {
      await this.planes.bloquearNombres();
      if (await this.planes.existeNombre(nuevo.nombre)) {
        throw new PlanInternetNombreDuplicadoError();
      }

      return this.planes.create(nuevo);
    });

    this.logger.log(
      `Plan ${creado.id} creado por el usuario ${input.usuarioId}.`,
    );

    return creado;
  }
}
