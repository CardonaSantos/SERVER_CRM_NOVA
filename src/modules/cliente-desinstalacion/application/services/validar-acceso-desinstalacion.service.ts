import { Inject, Injectable } from '@nestjs/common';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  AccesoInternetReadModel,
  EstadoAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import {
  ClienteDesinstalacionAccesoInvalidoError,
  ClienteDesinstalacionAccesoNoEncontradoError,
} from '../../domain/errors/cliente-desinstalacion.errors';

export type ValidarAccesoDesinstalacionParams = {
  clienteId: number;
  accesoInternetId: number;
};

/** El acceso debe ser del cliente, no estar dado de baja y tener un servicio asociado. */
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
      throw new ClienteDesinstalacionAccesoNoEncontradoError();
    }

    if (acceso.estado === EstadoAccesoInternet.BAJA) {
      throw new ClienteDesinstalacionAccesoInvalidoError(
        'El acceso seleccionado ya se encuentra dado de baja.',
      );
    }

    if (acceso.servicioInternetId === null) {
      throw new ClienteDesinstalacionAccesoInvalidoError(
        'El acceso seleccionado no tiene un servicio de internet asociado.',
      );
    }

    return acceso;
  }
}
