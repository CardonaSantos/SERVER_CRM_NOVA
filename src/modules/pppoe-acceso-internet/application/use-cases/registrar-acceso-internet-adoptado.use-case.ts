import { Inject, Injectable } from '@nestjs/common';

import { ClienteAccesoInternetEntity } from '../../domain/entities/cliente-acceso-internet.entity';
import {
  CLIENTE_ACCESO_INTERNET_REPOSITORY,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/cliente-acceso-internet-repository.port';
import {
  AccesoInternetReadModel,
  aAccesoInternetReadModel,
} from '../../domain/read-models/acceso-internet.read-model';
import { RegistrarAccesoInternetAdoptadoInput } from '../../public/pppoe-acceso-internet.facade.port';

/** Registra un acceso que ya funcionaba en el router, en su estado remoto real. */
@Injectable()
export class RegistrarAccesoInternetAdoptadoUseCase {
  constructor(
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesos: ClienteAccesoInternetRepositoryPort,
  ) {}

  async execute(
    input: RegistrarAccesoInternetAdoptadoInput,
  ): Promise<AccesoInternetReadModel> {
    const acceso = ClienteAccesoInternetEntity.adoptarExistente(input);
    return aAccesoInternetReadModel(await this.accesos.create(acceso));
  }
}
