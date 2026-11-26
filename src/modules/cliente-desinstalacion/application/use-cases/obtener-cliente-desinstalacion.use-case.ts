import { Inject, Injectable } from '@nestjs/common';
import { ClienteDesinstalacionNoEncontradaError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_QUERY,
  ClienteDesinstalacionQueryPort,
} from '../../domain/ports/cliente-desinstalacion-query.port';
import { ClienteDesinstalacionDetalle } from '../../domain/read-models/cliente-desinstalacion.read-model';

export type ObtenerClienteDesinstalacionInput = { id: number };

@Injectable()
export class ObtenerClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_QUERY)
    private readonly consultas: ClienteDesinstalacionQueryPort,
  ) {}

  async execute(
    input: ObtenerClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionDetalle> {
    const detalle = await this.consultas.findDetalleById(input.id);

    if (!detalle) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    return detalle;
  }
}
