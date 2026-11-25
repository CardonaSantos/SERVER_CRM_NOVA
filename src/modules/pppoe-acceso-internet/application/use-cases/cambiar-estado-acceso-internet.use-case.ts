import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { ClienteAccesoInternetEntity } from '../../domain/entities/cliente-acceso-internet.entity';
import { AccesoInternetNoEncontradoError } from '../../domain/errors/pppoe-acceso-internet.errors';
import {
  CLIENTE_ACCESO_INTERNET_REPOSITORY,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/cliente-acceso-internet-repository.port';
import {
  AccesoInternetReadModel,
  aAccesoInternetReadModel,
} from '../../domain/read-models/acceso-internet.read-model';
import {
  CambiarEstadoAccesoInternetInput,
  TransicionAccesoInternet,
} from '../../public/pppoe-acceso-internet.facade.port';

@Injectable()
export class CambiarEstadoAccesoInternetUseCase {
  constructor(
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesos: ClienteAccesoInternetRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CambiarEstadoAccesoInternetInput,
  ): Promise<AccesoInternetReadModel> {
    const acceso = await this.accesos.findById(input.accesoInternetId);
    if (!acceso) throw new AccesoInternetNoEncontradoError();

    aplicar(acceso, input.transicion, input.fecha ?? this.reloj.ahora());

    return aAccesoInternetReadModel(await this.accesos.update(acceso));
  }
}

function aplicar(
  acceso: ClienteAccesoInternetEntity,
  transicion: TransicionAccesoInternet,
  fecha: Date,
): void {
  switch (transicion) {
    case 'INICIAR_CONFIGURACION':
      return acceso.iniciarConfiguracion(fecha);
    case 'ACTIVAR':
      return acceso.activar(fecha);
    case 'SUSPENDER':
      return acceso.suspender(fecha);
    case 'DAR_DE_BAJA':
      return acceso.darDeBaja(fecha);
    default: {
      const exhaustivo: never = transicion;
      throw new Error(`Transición no soportada: ${String(exhaustivo)}`);
    }
  }
}
