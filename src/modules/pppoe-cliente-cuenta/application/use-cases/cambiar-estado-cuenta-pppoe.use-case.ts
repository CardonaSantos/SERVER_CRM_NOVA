import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { ClientePppoeCuentaEntity } from '../../domain/entities/cliente-pppoe-cuenta.entity';
import { CuentaPppoeNoEncontradaError } from '../../domain/errors/pppoe-cliente-cuenta.errors';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from '../../domain/ports/cliente-pppoe-cuenta-repository.port';
import {
  ClientePppoeCuentaReadModel,
  aClientePppoeCuentaReadModel,
} from '../../domain/read-models/cliente-pppoe-cuenta.read-model';
import {
  CambiarEstadoCuentaPppoeInput,
  TransicionCuentaPppoe,
} from '../../public/pppoe-cliente-cuenta.facade.port';

@Injectable()
export class CambiarEstadoCuentaPppoeUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentas: ClientePppoeCuentaRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CambiarEstadoCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    const cuenta = await this.cuentas.findById(input.cuentaPppoeId);
    if (!cuenta) throw new CuentaPppoeNoEncontradaError();

    aplicar(cuenta, input.transicion, input.fecha ?? this.reloj.ahora());

    return aClientePppoeCuentaReadModel(await this.cuentas.update(cuenta));
  }
}

function aplicar(
  cuenta: ClientePppoeCuentaEntity,
  transicion: TransicionCuentaPppoe,
  fecha: Date,
): void {
  switch (transicion) {
    case 'INICIAR_INSTALACION':
      return cuenta.iniciarInstalacion(fecha);
    case 'REINTENTAR_INSTALACION':
      return cuenta.reintentarInstalacion(fecha);
    case 'MARCAR_SECRET_CREADO':
      return cuenta.marcarSecretCreado(fecha);
    case 'INICIAR_ACTIVACION':
      return cuenta.iniciarActivacion(fecha);
    case 'REINTENTAR_ACTIVACION':
      return cuenta.reintentarActivacion(fecha);
    case 'MARCAR_ACTIVA':
      return cuenta.marcarActiva(fecha);
    case 'MARCAR_SUSPENDIDA':
      return cuenta.marcarSuspendida(fecha);
    case 'INICIAR_DESINSTALACION':
      return cuenta.iniciarDesinstalacion(fecha);
    case 'MARCAR_ELIMINADA':
      return cuenta.marcarEliminada(fecha);
    default: {
      const exhaustivo: never = transicion;
      throw new Error(`Transición no soportada: ${String(exhaustivo)}`);
    }
  }
}
