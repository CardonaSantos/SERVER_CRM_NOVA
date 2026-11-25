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
import { CrearCuentaPppoeInput } from '../../public/pppoe-cliente-cuenta.facade.port';

@Injectable()
export class CrearCuentaPppoeUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentas: ClientePppoeCuentaRepositoryPort,
  ) {}

  async execute(
    input: CrearCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    const cuenta = ClientePppoeCuentaEntity.create(input);
    return aClientePppoeCuentaReadModel(await this.cuentas.create(cuenta));
  }
}
