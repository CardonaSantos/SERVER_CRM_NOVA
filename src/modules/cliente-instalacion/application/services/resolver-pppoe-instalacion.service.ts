import { Inject, Injectable } from '@nestjs/common';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { ClientePppoeCuentaReadModel } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { AccionInstalacionAcceso } from '../../domain/enums/accion-instalacion-acceso.enum';
import { ClienteInstalacionPppoeConflictoError } from '../../domain/errors/cliente-instalacion.errors';
import { esGponPppoe } from '../../domain/policies/acceso-instalacion.policy';
import {
  CLIENTE_INSTALACION_ACCESO_REPOSITORY,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso-repository.port';

export type ResolverPppoeInstalacionResult =
  | { aplica: false; accesoInternetId: null; cuenta: null }
  | {
      aplica: true;
      accesoInternetId: number;
      cuenta: ClientePppoeCuentaReadModel;
    };

const NO_APLICA: ResolverPppoeInstalacionResult = {
  aplica: false,
  accesoInternetId: null,
  cuenta: null,
};

/**
 * Resuelve el acceso PPPoE nuevo de una instalación y su cuenta.
 * No ejecuta SSH ni modifica nada.
 */
@Injectable()
export class ResolverPppoeInstalacionService {
  constructor(
    @Inject(CLIENTE_INSTALACION_ACCESO_REPOSITORY)
    private readonly vinculos: ClienteInstalacionAccesoRepositoryPort,

    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
  ) {}

  async resolve(
    instalacion: ClienteInstalacionEntity,
  ): Promise<ResolverPppoeInstalacionResult> {
    if (!instalacion.id) {
      throw new ClienteInstalacionPppoeConflictoError(
        'La instalación debe estar guardada para resolver su cuenta PPPoE.',
      );
    }

    const vinculo = await this.vinculos.findByInstalacionId(instalacion.id);

    // Una instalación puede no tener todavía un acceso vinculado.
    if (!vinculo) {
      return NO_APLICA;
    }

    // El alta inicial solo corresponde al acceso que creó esta instalación:
    // uno MODIFICADO puede tener servicio activo y no se recrea.
    if (vinculo.accion !== AccionInstalacionAcceso.CREADO) {
      return NO_APLICA;
    }

    const acceso = await this.accesosInternet.buscarDelCliente({
      accesoInternetId: vinculo.accesoInternetId,
      clienteId: instalacion.clienteId,
    });

    if (!acceso?.id) {
      throw new ClienteInstalacionPppoeConflictoError(
        'El acceso vinculado a la instalación no existe o no pertenece al cliente.',
      );
    }

    if (!esGponPppoe(acceso.tecnologia, acceso.metodoAutenticacion)) {
      return NO_APLICA;
    }

    const cuenta = await this.cuentasPppoe.buscarPorAccesoInternet(acceso.id);

    if (!cuenta) {
      throw new ClienteInstalacionPppoeConflictoError(
        'El acceso GPON/PPPoE no tiene una prealta disponible. Debe ejecutarse el reintento de prealta antes de iniciar la instalación.',
      );
    }

    if (cuenta.id === null) {
      throw new ClienteInstalacionPppoeConflictoError(
        'La cuenta PPPoE no tiene un identificador válido.',
      );
    }

    return { aplica: true, accesoInternetId: acceso.id, cuenta };
  }
}
