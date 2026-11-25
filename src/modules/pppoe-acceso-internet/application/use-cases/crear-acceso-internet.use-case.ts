import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { ClienteAccesoInternetEntity } from '../../domain/entities/cliente-acceso-internet.entity';
import {
  CLIENTE_ACCESO_INTERNET_REPOSITORY,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/cliente-acceso-internet-repository.port';
import {
  AccesoInternetReadModel,
  aAccesoInternetReadModel,
} from '../../domain/read-models/acceso-internet.read-model';
import { CrearAccesoInternetInput } from '../../public/pppoe-acceso-internet.facade.port';

@Injectable()
export class CrearAccesoInternetUseCase {
  constructor(
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesos: ClienteAccesoInternetRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearAccesoInternetInput,
  ): Promise<AccesoInternetReadModel> {
    const acceso = ClienteAccesoInternetEntity.create(
      input,
      this.reloj.ahora(),
    );
    return aAccesoInternetReadModel(await this.accesos.create(acceso));
  }
}
