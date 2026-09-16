import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';

import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from 'src/modules/ppoe-instalacion-acceso/tokens/instalacion-acceso.token';

import { ClienteInstalacionAccesoRepositoryPort } from 'src/modules/ppoe-instalacion-acceso/domain/ports/cliente-instalacion-acceso.port';

import { AccionInstalacionAcceso } from 'src/modules/ppoe-instalacion-acceso/domain/enums/ppoe-instalacion-acceso.enum';

import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';

import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';

import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/ppoe-cliente-cuenta.entity';

export type ResolverPppoeInstalacionResult =
  | {
      aplica: false;

      accesoInternetId: null;

      cuenta: null;
    }
  | {
      aplica: true;

      accesoInternetId: number;

      cuenta: ClientePppoeCuentaEntity;
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

    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoInternetRepository: ClienteAccesoInternetRepositoryPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaPppoeRepository: ClientePppoeCuentaRepositoryPort,
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

    const acceso = await this.accesoInternetRepository.findByIdForClient({
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
      await this.cuentaPppoeRepository.findByAccesoInternetId(accesoInternetId);

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
