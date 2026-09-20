import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';

import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import {
  PPPOE_PREALTA,
  PppoePrealtaPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-prealta.port';

import { ReintentarPrealtaPppoeCommand } from '../commands/reintentar-prealta-pppoe.command';

import {
  EstadoResultadoPrealtaPppoe,
  PrealtaPppoeInstalacionResult,
} from '../../results/crear-cliente-instalacion.result';
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from 'src/modules/ppoe-instalacion-acceso/tokens/instalacion-acceso.token';
import { ClienteInstalacionAccesoRepositoryPort } from 'src/modules/ppoe-instalacion-acceso/domain/ports/cliente-instalacion-acceso.port';

@Injectable()
export class ReintentarPrealtaPppoeInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,

    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoInternetRepository: ClienteAccesoInternetRepositoryPort,

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

    const acceso = await this.accesoInternetRepository.findByIdForClient({
      accesoInternetId: command.accesoInternetId,
      clienteId: detalle.cliente.id,
    });

    if (!acceso) {
      throw new NotFoundException(
        'No se encontró el acceso de internet indicado para este cliente.',
      );
    }

    const accesoProps = acceso.toPrimitives();

    if (accesoProps.id === null) {
      throw new ConflictException(
        'El acceso de internet todavía no está persistido.',
      );
    }

    if (accesoProps.tecnologia !== TecnologiaAccesoInternet.FIBRA_GPON) {
      throw new ConflictException(
        'La prealta PPPoE solamente aplica a accesos FIBRA_GPON.',
      );
    }

    if (accesoProps.metodoAutenticacion !== MetodoAutenticacionInternet.PPPOE) {
      throw new ConflictException(
        'El acceso indicado no utiliza autenticación PPPoE.',
      );
    }

    if (accesoProps.servicioInternetId === null) {
      throw new ConflictException(
        'El acceso de internet no tiene un servicio asociado.',
      );
    }

    const resultado = await this.pppoePrealta.preparar({
      instalacionId: command.instalacionId,

      empresaId: accesoProps.empresaId,

      clienteId: accesoProps.clienteId,

      servicioInternetId: accesoProps.servicioInternetId,

      accesoInternetId: accesoProps.id,

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
