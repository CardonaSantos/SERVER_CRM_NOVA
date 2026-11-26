import { Inject, Injectable } from '@nestjs/common';
import {
  ClienteEliminadoError,
  ClienteNoEncontradoError,
} from '../../domain/errors/cliente.errors';
import {
  CLIENTE_REPOSITORY,
  ClienteRepositoryPort,
} from '../../domain/ports/cliente-repository.port';
import { IpClienteReadModel } from '../../domain/read-models/ip-cliente.read-model';

export type ActualizarIpClienteInput = {
  clienteId: number;
  direccionIp: string;
  gateway: string;
  mascara: string;
};

/** Registra la IP del cliente. Solo en la base de datos: no toca el router. */
@Injectable()
export class ActualizarIpClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepositoryPort,
  ) {}

  async execute(input: ActualizarIpClienteInput): Promise<IpClienteReadModel> {
    const cliente = await this.clientes.findById(input.clienteId);
    if (!cliente) throw new ClienteNoEncontradoError();
    if (cliente.isEliminado) throw new ClienteEliminadoError();

    return this.clientes.guardarIp(input.clienteId, {
      direccionIp: input.direccionIp,
      gateway: input.gateway,
      mascara: input.mascara,
    });
  }
}
