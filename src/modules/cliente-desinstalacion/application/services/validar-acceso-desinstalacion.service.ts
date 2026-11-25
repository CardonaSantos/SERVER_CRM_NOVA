import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';

import { AccesoInternetReadModel } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';

import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';

export type ValidarAccesoDesinstalacionParams = {
  clienteId: number;

  accesoInternetId: number;
};

@Injectable()
export class ValidarAccesoDesinstalacionService {
  constructor(
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,
  ) {}

  async validar(
    params: ValidarAccesoDesinstalacionParams,
  ): Promise<AccesoInternetReadModel> {
    const acceso = await this.accesosInternet.buscarDelCliente({
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
