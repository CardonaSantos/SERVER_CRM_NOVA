import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';
import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';

export type ValidarAccesoDesinstalacionParams = {
  empresaId: number;

  clienteId: number;

  servicioInternetId: number | null;

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
    const acceso = await this.accesoInternetRepository.findById({
      empresaId: params.empresaId,

      accesoInternetId: params.accesoInternetId,
    });

    if (!acceso) {
      throw new NotFoundException(
        `El acceso de internet ${params.accesoInternetId} no existe.`,
      );
    }

    if (acceso.empresaId !== params.empresaId) {
      throw new ConflictException(
        `El acceso de internet ${params.accesoInternetId} no pertenece a la empresa indicada.`,
      );
    }

    if (acceso.clienteId !== params.clienteId) {
      throw new ConflictException(
        `El acceso de internet ${params.accesoInternetId} pertenece al cliente ${acceso.clienteId}, no al cliente ${params.clienteId}.`,
      );
    }

    if (acceso.servicioInternetId !== params.servicioInternetId) {
      throw new ConflictException(
        this.buildServicioMismatchMessage({
          accesoInternetId: params.accesoInternetId,

          servicioAccesoId: acceso.servicioInternetId,

          servicioDesinstalacionId: params.servicioInternetId,
        }),
      );
    }

    return acceso;
  }

  private buildServicioMismatchMessage(params: {
    accesoInternetId: number;

    servicioAccesoId: number | null;

    servicioDesinstalacionId: number | null;
  }): string {
    const servicioAcceso = params.servicioAccesoId ?? 'sin servicio';

    const servicioDesinstalacion =
      params.servicioDesinstalacionId ?? 'sin servicio';

    return (
      `El acceso de internet ${params.accesoInternetId} está vinculado al servicio ` +
      `${servicioAcceso}, pero la desinstalación indica el servicio ` +
      `${servicioDesinstalacion}.`
    );
  }
}
