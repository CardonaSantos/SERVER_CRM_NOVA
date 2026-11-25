import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { CuentaPppoeNoEncontradaError } from '../../domain/errors/pppoe-cliente-cuenta.errors';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from '../../domain/ports/cliente-pppoe-cuenta-repository.port';
import {
  ClientePppoeCuentaReadModel,
  aClientePppoeCuentaReadModel,
} from '../../domain/read-models/cliente-pppoe-cuenta.read-model';
import { RegistrarErrorCuentaPppoeInput } from '../../public/pppoe-cliente-cuenta.facade.port';

@Injectable()
export class RegistrarErrorCuentaPppoeUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentas: ClientePppoeCuentaRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: RegistrarErrorCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    const cuenta = await this.cuentas.findById(input.cuentaPppoeId);
    if (!cuenta) throw new CuentaPppoeNoEncontradaError();

    cuenta.registrarError(input.mensaje, input.fecha ?? this.reloj.ahora());

    return aClientePppoeCuentaReadModel(await this.cuentas.update(cuenta));
  }
}
