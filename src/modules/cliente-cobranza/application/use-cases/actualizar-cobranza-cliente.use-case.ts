import { Inject, Injectable } from '@nestjs/common';
import { EstadoCobranzaCliente } from '../../../cliente/public/cliente.types';
import { estadoCobranzaPorPendientes } from '../../domain/policies/estado-cobranza.policy';
import {
  CLIENTE_COBRANZA_REPOSITORY,
  ClienteCobranzaRepositoryPort,
} from '../../domain/ports/cliente-cobranza-repository.port';

export type ActualizarCobranzaClienteInput = {
  clienteId: number;
  facturasPendientes: number;
};

/** Deja la cobranza del cliente según sus facturas pendientes. */
@Injectable()
export class ActualizarCobranzaClienteUseCase {
  constructor(
    @Inject(CLIENTE_COBRANZA_REPOSITORY)
    private readonly clientes: ClienteCobranzaRepositoryPort,
  ) {}

  async execute(
    input: ActualizarCobranzaClienteInput,
  ): Promise<EstadoCobranzaCliente> {
    const estado = estadoCobranzaPorPendientes(input.facturasPendientes);
    await this.clientes.guardar(input.clienteId, estado);

    return estado;
  }
}
