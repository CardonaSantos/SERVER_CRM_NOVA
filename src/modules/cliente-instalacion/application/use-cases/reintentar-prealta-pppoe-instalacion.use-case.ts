import { Inject, Injectable } from '@nestjs/common';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import {
  PPPOE_PREALTA,
  PppoePrealtaPort,
} from 'src/modules/pppoe-automatizacion/public/pppoe-prealta.port';
import { EstadoResultadoPrealtaPppoe } from '../../domain/enums/estado-resultado-prealta-pppoe.enum';
import {
  ClienteInstalacionAccesoNoEncontradoError,
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionPppoeConflictoError,
} from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_ACCESO_REPOSITORY,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso-repository.port';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import { PrealtaPppoeExitosaResult } from '../services/provisionar-acceso-instalacion.service';

export type ReintentarPrealtaPppoeInput = {
  instalacionId: number;
  accesoInternetId: number;
  mikrotikRouterId: number;
  operadorId: number;
  operadorNombre?: string | null;
  ipOrigen?: string | null;
  userAgent?: string | null;
};

/**
 * Repite la prealta PPPoE de un acceso GPON/PPPoE de la instalación, por
 * ejemplo cuando falló al crearla. Es idempotente: si ya hay cuenta, la devuelve.
 */
@Injectable()
export class ReintentarPrealtaPppoeInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(CLIENTE_INSTALACION_ACCESO_REPOSITORY)
    private readonly vinculos: ClienteInstalacionAccesoRepositoryPort,

    @Inject(PPPOE_PREALTA)
    private readonly prealta: PppoePrealtaPort,
  ) {}

  async execute(
    input: ReintentarPrealtaPppoeInput,
  ): Promise<PrealtaPppoeExitosaResult> {
    const instalacion = await this.instalaciones.findById(input.instalacionId);

    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    const vinculo = await this.vinculos.findByInstalacionAndAcceso({
      instalacionId: input.instalacionId,
      accesoInternetId: input.accesoInternetId,
    });

    if (!vinculo) {
      throw new ClienteInstalacionAccesoNoEncontradoError(
        'El acceso indicado no está vinculado a la instalación.',
      );
    }

    const acceso = await this.accesosInternet.buscarDelCliente({
      accesoInternetId: input.accesoInternetId,
      clienteId: instalacion.clienteId,
    });

    if (!acceso) {
      throw new ClienteInstalacionAccesoNoEncontradoError(
        'No se encontró el acceso de internet indicado para este cliente.',
      );
    }

    if (acceso.tecnologia !== TecnologiaAccesoInternet.FIBRA_GPON) {
      throw new ClienteInstalacionPppoeConflictoError(
        'La prealta PPPoE solamente aplica a accesos FIBRA_GPON.',
      );
    }

    if (acceso.metodoAutenticacion !== MetodoAutenticacionInternet.PPPOE) {
      throw new ClienteInstalacionPppoeConflictoError(
        'El acceso indicado no utiliza autenticación PPPoE.',
      );
    }

    if (acceso.servicioInternetId === null) {
      throw new ClienteInstalacionPppoeConflictoError(
        'El acceso de internet no tiene un servicio asociado.',
      );
    }

    const resultado = await this.prealta.preparar({
      instalacionId: input.instalacionId,
      empresaId: acceso.empresaId,
      clienteId: acceso.clienteId,
      servicioInternetId: acceso.servicioInternetId,
      accesoInternetId: acceso.id,
      mikrotikRouterId: input.mikrotikRouterId,
      operadorId: input.operadorId,
      operadorNombre: input.operadorNombre ?? null,
      ipOrigen: input.ipOrigen ?? null,
      userAgent: input.userAgent ?? null,
    });

    return {
      aplica: true,
      estado: resultado.creada
        ? EstadoResultadoPrealtaPppoe.CREADA
        : EstadoResultadoPrealtaPppoe.YA_EXISTIA,
      cuentaPppoeId: resultado.cuentaPppoeId,
      perfilHomologacionId: resultado.perfilHomologacionId,
      usuario: resultado.usuario,
      estadoCuenta: resultado.estado,
      generadoEn: resultado.generadoEn,
      mensaje: null,
      reintentable: false,
    };
  }
}
