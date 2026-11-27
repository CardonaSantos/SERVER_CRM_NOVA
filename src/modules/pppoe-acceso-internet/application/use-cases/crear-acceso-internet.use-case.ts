import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  SERVICIO,
  ServicioFacadePort,
} from '../../../servicio/public/servicio.facade.port';

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
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(SERVICIO)
    private readonly servicios: ServicioFacadePort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearAccesoInternetInput,
  ): Promise<AccesoInternetReadModel> {
    const acceso = ClienteAccesoInternetEntity.create(
      input,
      this.reloj.ahora(),
    );
    return this.unidad.ejecutar(async () => {
      if (typeof input.servicioInternetId === 'number') {
        await this.servicios.verificarPlanAsignable({
          planId: input.servicioInternetId,
          clienteId: input.clienteId,
        });
      }

      return aAccesoInternetReadModel(await this.accesos.create(acceso));
    });
  }
}
