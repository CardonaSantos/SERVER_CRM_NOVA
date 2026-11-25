import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';

import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from 'src/modules/ppoe-instalacion-acceso/tokens/instalacion-acceso.token';

import { ClienteInstalacionAccesoRepositoryPort } from 'src/modules/ppoe-instalacion-acceso/domain/ports/cliente-instalacion-acceso.port';

import { AccionInstalacionAcceso } from 'src/modules/ppoe-instalacion-acceso/domain/enums/ppoe-instalacion-acceso.enum';

import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';

import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';

import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

import { ClientePppoeCuentaReadModel } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

export type ResolverPppoeInstalacionResult =
  | {
      aplica: false;

      accesoInternetId: null;

      cuenta: null;
    }
  | {
      aplica: true;

      accesoInternetId: number;

      cuenta: ClientePppoeCuentaReadModel;
    };

/**
 * Resuelve el acceso PPPoE nuevo asociado
 * a una instalación.
 *
 * No ejecuta SSH ni modifica entidades.
 */
@Injectable()
export class ResolverPppoeInstalacionService {
  constructor(
    @Inject(CLIENTE_INSTALACION_ACCESO_REPOSITORY)
    private readonly instalacionAccesoRepository: ClienteInstalacionAccesoRepositoryPort,

    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
  ) {}

  async resolve(
    instalacion: ClienteInstalacionEntity,
  ): Promise<ResolverPppoeInstalacionResult> {
    if (!instalacion.id) {
      throw new ConflictException(
        'La instalación debe estar persistida para resolver su cuenta PPPoE.',
      );
    }

    const vinculo = await this.instalacionAccesoRepository.findByInstalacionId(
      instalacion.id,
    );

    /*
     * Una instalación puede no tener todavía un acceso vinculado.
     */
    if (!vinculo) {
      return {
        aplica: false,
        accesoInternetId: null,
        cuenta: null,
      };
    }

    /*
     * El provisionamiento inicial solamente corresponde
     * al acceso creado por esta instalación.
     *
     * Un acceso MODIFICADO puede tener un servicio activo
     * y no debe recrearse automáticamente.
     */
    if (vinculo.accion !== AccionInstalacionAcceso.CREADO) {
      return {
        aplica: false,
        accesoInternetId: null,
        cuenta: null,
      };
    }

    const acceso = await this.accesosInternet.buscarDelCliente({
      accesoInternetId: vinculo.accesoInternetId,
      clienteId: instalacion.clienteId,
    });

    if (!acceso) {
      throw new ConflictException(
        `El acceso ${vinculo.accesoInternetId} vinculado a la instalación no existe o no pertenece al cliente.`,
      );
    }

    const esGponPppoe =
      acceso.tecnologia === TecnologiaAccesoInternet.FIBRA_GPON &&
      acceso.metodoAutenticacion === MetodoAutenticacionInternet.PPPOE;

    if (!esGponPppoe) {
      return {
        aplica: false,
        accesoInternetId: null,
        cuenta: null,
      };
    }

    if (!acceso.id) {
      throw new ConflictException(
        'El acceso PPPoE vinculado no contiene un identificador persistido.',
      );
    }

    const accesoInternetId = acceso.id;

    const cuenta =
      await this.cuentasPppoe.buscarPorAccesoInternet(accesoInternetId);

    if (!cuenta) {
      throw new ConflictException(
        'El acceso GPON/PPPoE no tiene una prealta disponible. Debe ejecutarse el reintento de prealta antes de iniciar la instalación.',
      );
    }

    if (cuenta.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE no contiene un identificador persistido.',
      );
    }

    if (cuenta.empresaId !== instalacion.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE y la instalación pertenecen a empresas diferentes.',
      );
    }

    return {
      aplica: true,
      accesoInternetId,
      cuenta,
    };
  }
}
