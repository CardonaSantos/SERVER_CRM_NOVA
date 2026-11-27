import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { ServicioAdicionalEntity } from '../../domain/entities/servicio-adicional.entity';
import {
  ServicioAdicionalNombreDuplicadoError,
  TipoServicioNoEncontradoError,
} from '../../domain/errors/servicio.errors';
import {
  SERVICIO_ADICIONAL_REPOSITORY,
  ServicioAdicionalRepositoryPort,
} from '../../domain/ports/servicio-adicional-repository.port';
import {
  TIPO_SERVICIO_REPOSITORY,
  TipoServicioRepositoryPort,
} from '../../domain/ports/tipo-servicio-repository.port';
import { CrearServicioAdicionalProps } from '../../domain/props/servicio-adicional.props';

export type CrearServicioAdicionalInput = CrearServicioAdicionalProps & {
  usuarioId: number;
};

@Injectable()
export class CrearServicioAdicionalUseCase {
  private readonly logger = new Logger(CrearServicioAdicionalUseCase.name);

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
    input: CrearServicioAdicionalInput,
  ): Promise<ServicioAdicionalEntity> {
    const nuevo = ServicioAdicionalEntity.create(input, this.reloj.ahora());

    const creado = await this.unidad.ejecutar(async () => {
      const tipoId = input.tipoServicioId;
      if (typeof tipoId === 'number' && !(await this.tipos.findById(tipoId))) {
        throw new TipoServicioNoEncontradoError();
      }

      await this.servicios.bloquearNombres();
      if (await this.servicios.existeNombre(nuevo.nombre)) {
        throw new ServicioAdicionalNombreDuplicadoError();
      }

      return this.servicios.create(nuevo);
    });

    this.logger.log(
      `Servicio adicional ${creado.id} creado por el usuario ${input.usuarioId}.`,
    );

    return creado;
  }
}
