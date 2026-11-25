import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

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

import { ReintentarPrealtaPppoeCommand } from '../commands/reintentar-prealta-pppoe.command';

import {
  EstadoResultadoPrealtaPppoe,
  PrealtaPppoeInstalacionResult,
} from '../../results/crear-cliente-instalacion.result';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from 'src/modules/ppoe-instalacion-acceso/tokens/instalacion-acceso.token';
import { ClienteInstalacionAccesoRepositoryPort } from 'src/modules/ppoe-instalacion-acceso/domain/ports/cliente-instalacion-acceso.port';

@Injectable()
export class ReintentarPrealtaPppoeInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,

    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(CLIENTE_INSTALACION_ACCESO_REPOSITORY)
    private readonly instalacionAccesoRepository: ClienteInstalacionAccesoRepositoryPort,

    @Inject(PPPOE_PREALTA)
    private readonly pppoePrealta: PppoePrealtaPort,
  ) {}

  async execute(
    command: ReintentarPrealtaPppoeCommand,
  ): Promise<PrealtaPppoeInstalacionResult> {
    const detalle = await this.instalacionRepository.findDetailById({
      id: command.instalacionId,
    });

    if (!detalle) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.instalacionId}.`,
      );
    }

    const vinculo =
      await this.instalacionAccesoRepository.findByInstalacionAndAcceso({
        instalacionId: command.instalacionId,
        accesoInternetId: command.accesoInternetId,
      });

    if (!vinculo) {
      throw new NotFoundException(
        'El acceso indicado no está vinculado a la instalación.',
      );
    }

    const acceso = await this.accesosInternet.buscarDelCliente({
      accesoInternetId: command.accesoInternetId,
      clienteId: detalle.cliente.id,
    });

    if (!acceso) {
      throw new NotFoundException(
        'No se encontró el acceso de internet indicado para este cliente.',
      );
    }

    if (acceso.tecnologia !== TecnologiaAccesoInternet.FIBRA_GPON) {
      throw new ConflictException(
        'La prealta PPPoE solamente aplica a accesos FIBRA_GPON.',
      );
    }

    if (acceso.metodoAutenticacion !== MetodoAutenticacionInternet.PPPOE) {
      throw new ConflictException(
        'El acceso indicado no utiliza autenticación PPPoE.',
      );
    }

    if (acceso.servicioInternetId === null) {
      throw new ConflictException(
        'El acceso de internet no tiene un servicio asociado.',
      );
    }

    const resultado = await this.pppoePrealta.preparar({
      instalacionId: command.instalacionId,

      empresaId: acceso.empresaId,

      clienteId: acceso.clienteId,

      servicioInternetId: acceso.servicioInternetId,

      accesoInternetId: acceso.id,

      mikrotikRouterId: command.mikrotikRouterId,

      operadorId: command.operadorId,

      operadorNombre: command.operadorNombre ?? null,

      ipOrigen: command.ipOrigen ?? null,

      userAgent: command.userAgent ?? null,
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
