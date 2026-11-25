import { Inject, Injectable } from '@nestjs/common';

import { ClientePppoeCuentaEntity } from '../../domain/entities/cliente-pppoe-cuenta.entity';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from '../../domain/ports/cliente-pppoe-cuenta-repository.port';
import {
  ClientePppoeCuentaReadModel,
  aClientePppoeCuentaReadModel,
} from '../../domain/read-models/cliente-pppoe-cuenta.read-model';

export type BuscarCuentaPppoeInput =
  | { por: 'ID'; cuentaPppoeId: number }
  | { por: 'ACCESO_INTERNET'; accesoInternetId: number }
  | { por: 'USUARIO_VIGENTE'; usuario: string };

/** Búsqueda sin error: devuelve null si no hay. La usa la fachada. */
@Injectable()
export class BuscarCuentaPppoeUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentas: ClientePppoeCuentaRepositoryPort,
  ) {}

  async execute(
    input: BuscarCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    const cuenta = await this.buscar(input);
    return cuenta ? aClientePppoeCuentaReadModel(cuenta) : null;
  }

  private buscar(
    input: BuscarCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaEntity | null> {
    switch (input.por) {
      case 'ID':
        return this.cuentas.findById(input.cuentaPppoeId);
      case 'ACCESO_INTERNET':
        return this.cuentas.findByAccesoInternetId(input.accesoInternetId);
      case 'USUARIO_VIGENTE':
        return this.cuentas.findVigenteByUsuario(input.usuario);
      default: {
        const exhaustivo: never = input;
        throw new Error(`Búsqueda no soportada: ${JSON.stringify(exhaustivo)}`);
      }
    }
  }
}
