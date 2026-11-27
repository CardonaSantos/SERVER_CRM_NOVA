import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENTE_COBRANZA_REPOSITORY,
  ClienteCobranzaRepositoryPort,
} from '../../domain/ports/cliente-cobranza-repository.port';

@Injectable()
export class BloquearCobranzaClienteUseCase {
  constructor(
    @Inject(CLIENTE_COBRANZA_REPOSITORY)
    private readonly clientes: ClienteCobranzaRepositoryPort,
  ) {}

  execute(clienteId: number): Promise<void> {
    return this.clientes.bloquear(clienteId);
  }
}
