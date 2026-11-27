import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { PlanInternetNoEncontradoError } from '../../domain/errors/servicio.errors';
import {
  ClientesDelPlan,
  PLAN_INTERNET_REPOSITORY,
  PlanInternetRepositoryPort,
} from '../../domain/ports/plan-internet-repository.port';
import {
  REAUTENTICACION_OPERADOR_SERVICIO,
  ReautenticacionOperadorPort,
} from '../ports/reautenticacion-operador.port';

export type CambiarPrecioPlanInternetInput = {
  planId: number;
  usuarioId: number;
  precio: number;
  contrasenaActual: string;
};

export type CambiarPrecioPlanInternetResult = {
  planId: number;
  precioAnterior: number;
  precioNuevo: number;
  /** Se les cobrará el precio nuevo desde la siguiente factura. */
  clientes: ClientesDelPlan;
};

/**
 * Cambia el precio de un plan, que se cobra a todos sus clientes desde la
 * siguiente factura. Las facturas ya generadas no cambian.
 */
@Injectable()
export class CambiarPrecioPlanInternetUseCase {
  private readonly logger = new Logger(CambiarPrecioPlanInternetUseCase.name);

  constructor(
    @Inject(PLAN_INTERNET_REPOSITORY)
    private readonly planes: PlanInternetRepositoryPort,
    @Inject(REAUTENTICACION_OPERADOR_SERVICIO)
    private readonly reautenticacion: ReautenticacionOperadorPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CambiarPrecioPlanInternetInput,
  ): Promise<CambiarPrecioPlanInternetResult> {
    await this.reautenticacion.confirmar(
      input.usuarioId,
      input.contrasenaActual,
    );

    const result = await this.unidad.ejecutar(async () => {
      await this.planes.bloquearParaModificar(input.planId);
      const plan = await this.planes.findById(input.planId);
      if (!plan) throw new PlanInternetNoEncontradoError();

      const precioAnterior = plan.precio;
      if (plan.cambiarPrecio(input.precio, this.reloj.ahora())) {
        await this.planes.guardarPrecio(plan);
      }

      return {
        planId: input.planId,
        precioAnterior,
        precioNuevo: plan.precio,
        clientes: await this.planes.contarClientes(input.planId),
      };
    });

    // No hay historial de precios: este registro es el rastro del cambio.
    this.logger.log(
      `Plan ${input.planId}: precio ${result.precioAnterior} → ${result.precioNuevo} por el usuario ${input.usuarioId} (${result.clientes.total} clientes).`,
    );

    return result;
  }
}
