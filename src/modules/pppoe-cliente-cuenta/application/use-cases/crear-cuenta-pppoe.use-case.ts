import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

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
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    const cuenta = ClientePppoeCuentaEntity.create(input, this.reloj.ahora());
    return aClientePppoeCuentaReadModel(await this.cuentas.create(cuenta));
  }
}
