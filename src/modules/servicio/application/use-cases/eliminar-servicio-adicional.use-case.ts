import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  ServicioAdicionalEnUsoError,
  ServicioAdicionalNoEncontradoError,
} from '../../domain/errors/servicio.errors';
import {
  SERVICIO_ADICIONAL_REPOSITORY,
  ServicioAdicionalRepositoryPort,
} from '../../domain/ports/servicio-adicional-repository.port';

export type EliminarServicioAdicionalInput = {
  servicioId: number;
  usuarioId: number;
};

export type EliminarServicioAdicionalResult = {
  servicioId: number;
  eliminadoEn: Date;
};

/**
 * Borrado lógico de un servicio sin asignaciones ni líneas de factura. La fila
 * nunca se borra.
 */
@Injectable()
export class EliminarServicioAdicionalUseCase {
  private readonly logger = new Logger(EliminarServicioAdicionalUseCase.name);

  constructor(
    @Inject(SERVICIO_ADICIONAL_REPOSITORY)
    private readonly servicios: ServicioAdicionalRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EliminarServicioAdicionalInput,
  ): Promise<EliminarServicioAdicionalResult> {
    const ahora = this.reloj.ahora();

    await this.unidad.ejecutar(async () => {
      // El bloqueo espera a quien lo esté asignando; el conteo ya lo ve.
      await this.servicios.bloquearParaModificar(input.servicioId);
      const servicio = await this.servicios.findById(input.servicioId);
      if (!servicio) throw new ServicioAdicionalNoEncontradoError();
      servicio.asegurarVigente();

      const uso = await this.servicios.contarUso(input.servicioId);
      if (uso.clientes > 0 || uso.facturas > 0) {
        throw new ServicioAdicionalEnUsoError(uso);
      }

      servicio.eliminar(input.usuarioId, ahora);
      await this.servicios.eliminar(servicio);
    });

    this.logger.log(
      `Servicio adicional ${input.servicioId} eliminado por el usuario ${input.usuarioId}.`,
    );

    return { servicioId: input.servicioId, eliminadoEn: ahora };
  }
}
