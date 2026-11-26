import { Inject, Injectable } from '@nestjs/common';
import { calcularAccionesTecnicas } from '../../domain/policies/acciones-tecnicas-instalacion.policy';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_QUERY,
  ClienteInstalacionQueryPort,
} from '../../domain/ports/cliente-instalacion-query.port';
import { ClienteInstalacionTechnicalResult } from '../../domain/read-models/instalacion-tecnica.read-model';

export type ObtenerDetalleTecnicoInstalacionInput = {
  instalacionId: number;
  /** El técnico autenticado: solo ve las instalaciones donde figura asignado. */
  actorId: number;
};

@Injectable()
export class ObtenerDetalleTecnicoInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_QUERY)
    private readonly consultas: ClienteInstalacionQueryPort,
  ) {}

  async execute(
    input: ObtenerDetalleTecnicoInstalacionInput,
  ): Promise<ClienteInstalacionTechnicalResult> {
    const detalle = await this.consultas.findTechnicalDetailById(
      input.instalacionId,
      input.actorId,
    );

    if (!detalle) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    return {
      ...detalle,
      acciones: calcularAccionesTecnicas(
        detalle.instalacion.estado,
        detalle.accesos,
      ),
    };
  }
}
