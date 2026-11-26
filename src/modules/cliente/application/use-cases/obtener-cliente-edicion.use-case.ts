import { Inject, Injectable } from '@nestjs/common';
import {
  ClienteEliminadoError,
  ClienteNoEncontradoError,
} from '../../domain/errors/cliente.errors';
import {
  CLIENTE_FICHA_QUERY,
  ClienteFichaQueryPort,
} from '../../domain/ports/cliente-ficha-query.port';
import { ClienteEdicionReadModel } from '../../domain/read-models/cliente-ficha.read-model';

/** Los datos del formulario de edición; un eliminado no se edita. */
@Injectable()
export class ObtenerClienteEdicionUseCase {
  constructor(
    @Inject(CLIENTE_FICHA_QUERY)
    private readonly consulta: ClienteFichaQueryPort,
  ) {}

  async execute(input: {
    clienteId: number;
  }): Promise<ClienteEdicionReadModel> {
    const cliente = await this.consulta.findEdicion(input.clienteId);
    if (!cliente) throw new ClienteNoEncontradoError();
    if (cliente.eliminado) throw new ClienteEliminadoError();

    return cliente;
  }
}
