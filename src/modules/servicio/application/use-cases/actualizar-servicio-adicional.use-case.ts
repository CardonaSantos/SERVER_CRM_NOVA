import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { ServicioAdicionalEntity } from '../../domain/entities/servicio-adicional.entity';
import {
  ServicioAdicionalNoEncontradoError,
  ServicioAdicionalNombreDuplicadoError,
  TipoServicioNoEncontradoError,
} from '../../domain/errors/servicio.errors';
import { mismoNombre } from '../../domain/policies/catalogo.policy';
import {
  SERVICIO_ADICIONAL_REPOSITORY,
  ServicioAdicionalRepositoryPort,
} from '../../domain/ports/servicio-adicional-repository.port';
import {
  TIPO_SERVICIO_REPOSITORY,
  TipoServicioRepositoryPort,
} from '../../domain/ports/tipo-servicio-repository.port';
import { ActualizarServicioAdicionalProps } from '../../domain/props/servicio-adicional.props';

export type ActualizarServicioAdicionalInput = {
  servicioId: number;
  usuarioId: number;
  cambios: ActualizarServicioAdicionalProps;
};

/** Lo que no llega no cambia. */
@Injectable()
export class ActualizarServicioAdicionalUseCase {
  private readonly logger = new Logger(ActualizarServicioAdicionalUseCase.name);

  constructor(
    @Inject(SERVICIO_ADICIONAL_REPOSITORY)
    private readonly servicios: ServicioAdicionalRepositoryPort,
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ActualizarServicioAdicionalInput,
  ): Promise<ServicioAdicionalEntity> {
    const guardado = await this.unidad.ejecutar(async () => {
      await this.servicios.bloquearParaModificar(input.servicioId);
      const servicio = await this.servicios.findById(input.servicioId);
      if (!servicio) throw new ServicioAdicionalNoEncontradoError();

      const nombreAnterior = servicio.nombre;
      servicio.actualizar(input.cambios, this.reloj.ahora());

      const tipoId = input.cambios.tipoServicioId;
      if (typeof tipoId === 'number' && !(await this.tipos.findById(tipoId))) {
        throw new TipoServicioNoEncontradoError();
      }

      if (!mismoNombre(servicio.nombre, nombreAnterior)) {
        await this.servicios.bloquearNombres();
        if (
          await this.servicios.existeNombre(servicio.nombre, input.servicioId)
        ) {
          throw new ServicioAdicionalNombreDuplicadoError();
        }
      }

      return this.servicios.update(servicio);
    });

    this.logger.log(
      `Servicio adicional ${input.servicioId} actualizado por el usuario ${input.usuarioId}.`,
    );

    return guardado;
  }
}
