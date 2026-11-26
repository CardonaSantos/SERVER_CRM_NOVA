import { Inject, Injectable } from '@nestjs/common';
import { ClienteNoEncontradoError } from '../../domain/errors/cliente.errors';
import {
  CLIENTE_FICHA_QUERY,
  ClienteFichaQueryPort,
} from '../../domain/ports/cliente-ficha-query.port';
import { ClienteDetalleReadModel } from '../../domain/read-models/cliente-ficha.read-model';

/**
 * La ficha de un cliente. La de un eliminado se puede consultar (es su
 * bitácora); trae la fecha en que se eliminó.
 */
@Injectable()
export class ObtenerDetalleClienteUseCase {
  constructor(
    @Inject(CLIENTE_FICHA_QUERY)
    private readonly consulta: ClienteFichaQueryPort,
  ) {}

  async execute(input: {
    clienteId: number;
  }): Promise<ClienteDetalleReadModel> {
    const detalle = await this.consulta.findDetalle(input.clienteId);
    if (!detalle) throw new ClienteNoEncontradoError();

    return detalle;
  }
}
