import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';

import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';

import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';

export type ValidarAccesoDesinstalacionParams = {
  clienteId: number;

  accesoInternetId: number;
};

@Injectable()
export class ValidarAccesoDesinstalacionService {
  constructor(
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoInternetRepository: ClienteAccesoInternetRepositoryPort,
  ) {}

  async validar(
    params: ValidarAccesoDesinstalacionParams,
  ): Promise<ClienteAccesoInternetEntity> {
    const acceso = await this.accesoInternetRepository.findByIdForClient({
      clienteId: params.clienteId,

      accesoInternetId: params.accesoInternetId,
    });

    if (!acceso) {
      throw new NotFoundException(
        `No existe el acceso ${params.accesoInternetId} para el cliente ${params.clienteId}.`,
      );
    }

    if (acceso.estado === EstadoAccesoInternet.BAJA) {
      throw new ConflictException(
        'El acceso seleccionado ya se encuentra dado de baja.',
      );
    }

    if (acceso.servicioInternetId === null) {
      throw new ConflictException(
        'El acceso seleccionado no tiene un servicio de internet asociado.',
      );
    }

    return acceso;
  }
}
