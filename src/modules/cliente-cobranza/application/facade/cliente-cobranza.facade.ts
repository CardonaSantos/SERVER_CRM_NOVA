import { Injectable } from '@nestjs/common';
import {
  ActualizarCobranzaClienteInput,
  ClienteCobranzaFacadePort,
  EstadoCobranzaCliente,
} from '../../public/cliente-cobranza.facade.port';
import { ActualizarCobranzaClienteUseCase } from '../use-cases/actualizar-cobranza-cliente.use-case';
import { BloquearCobranzaClienteUseCase } from '../use-cases/bloquear-cobranza-cliente.use-case';

@Injectable()
export class ClienteCobranzaFacade implements ClienteCobranzaFacadePort {
  constructor(
    private readonly bloquearCliente: BloquearCobranzaClienteUseCase,
    private readonly actualizarCobranza: ActualizarCobranzaClienteUseCase,
  ) {}

  bloquear(clienteId: number): Promise<void> {
    return this.bloquearCliente.execute(clienteId);
  }

  actualizar(
    input: ActualizarCobranzaClienteInput,
  ): Promise<EstadoCobranzaCliente> {
    return this.actualizarCobranza.execute(input);
  }
}
