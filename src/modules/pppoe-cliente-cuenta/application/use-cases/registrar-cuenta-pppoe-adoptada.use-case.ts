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
import { RegistrarCuentaPppoeAdoptadaInput } from '../../public/pppoe-cliente-cuenta.facade.port';

/** Registra una cuenta cuyo secret ya existía en el router, sin tocarlo. */
@Injectable()
export class RegistrarCuentaPppoeAdoptadaUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentas: ClientePppoeCuentaRepositoryPort,
  ) {}

  async execute(
    input: RegistrarCuentaPppoeAdoptadaInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    const cuenta = ClientePppoeCuentaEntity.adoptarExistente(input);
    return aClientePppoeCuentaReadModel(await this.cuentas.create(cuenta));
  }
}
