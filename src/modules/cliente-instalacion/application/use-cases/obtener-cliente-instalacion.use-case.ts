import { Inject, Injectable } from '@nestjs/common';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_QUERY,
  ClienteInstalacionQueryPort,
} from '../../domain/ports/cliente-instalacion-query.port';
import { ClienteInstalacionDetalle } from '../../domain/read-models/cliente-instalacion-detalle.read-model';

export type ObtenerClienteInstalacionInput = { id: number };

@Injectable()
export class ObtenerClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_QUERY)
    private readonly consultas: ClienteInstalacionQueryPort,
  ) {}

  async execute(
    input: ObtenerClienteInstalacionInput,
  ): Promise<ClienteInstalacionDetalle> {
    const detalle = await this.consultas.findDetailById(input.id);

    if (!detalle) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    return detalle;
  }
}
