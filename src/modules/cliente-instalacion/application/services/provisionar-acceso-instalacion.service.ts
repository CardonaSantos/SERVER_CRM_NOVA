import { DomainError } from 'src/common/hexagonal/domain-error';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
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
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/cliente-instalacion-acceso.entity';
import { AccionInstalacionAcceso } from '../../domain/enums/accion-instalacion-acceso.enum';
import { EstadoResultadoPrealtaPppoe } from '../../domain/enums/estado-resultado-prealta-pppoe.enum';
import { ModoAccesoInstalacion } from '../../domain/enums/modo-acceso-instalacion.enum';
import {
  ClienteInstalacionAccesoDuplicadoError,
  ClienteInstalacionAccesoNoEncontradoError,
} from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_ACCESO_REPOSITORY,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso-repository.port';

export type AccesoInstalacionEntrada =
  | {
      modo: ModoAccesoInstalacion.NUEVO;
      tecnologia: TecnologiaAccesoInternet;
      metodoAutenticacion: MetodoAutenticacionInternet;
      mikrotikRouterId?: number | null;
    }
  | {
      modo: ModoAccesoInstalacion.EXISTENTE;
      accesoInternetId: number;
    };

/** El acceso que quedó ligado a la instalación. */
export type ClienteInstalacionAccesoResult = {
  accesoInternetId: number;
  modo: ModoAccesoInstalacion;
  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
  /** Solo viaja al crear un acceso nuevo; no se guarda en el acceso. */
  mikrotikRouterId: number | null;
};

export type PrealtaPppoeNoAplicaResult = {
  aplica: false;
  estado: EstadoResultadoPrealtaPppoe.NO_APLICA;
  cuentaPppoeId: null;
  perfilHomologacionId: null;
  usuario: null;
  estadoCuenta: null;
  generadoEn: null;
  mensaje: null;
  reintentable: false;
};

export type PrealtaPppoeExitosaResult = {
  aplica: true;
  estado:
    | EstadoResultadoPrealtaPppoe.CREADA
    | EstadoResultadoPrealtaPppoe.YA_EXISTIA;
  cuentaPppoeId: number;
  perfilHomologacionId: number;
  usuario: string;
  estadoCuenta: EstadoCuentaPppoe;
  generadoEn: Date;
  mensaje: null;
  reintentable: false;
};

/** La prealta aplicaba y falló; la instalación y el acceso siguen creados. */
export type PrealtaPppoeFallidaResult = {
  aplica: true;
  estado: EstadoResultadoPrealtaPppoe.FALLIDA;
  cuentaPppoeId: null;
  perfilHomologacionId: null;
  usuario: null;
  estadoCuenta: null;
  generadoEn: null;
  /** Mensaje seguro para la pantalla. */
  mensaje: string;
  reintentable: true;
};

export type PrealtaPppoeInstalacionResult =
  | PrealtaPppoeNoAplicaResult
  | PrealtaPppoeExitosaResult
  | PrealtaPppoeFallidaResult;

export type VincularAccesoParams = {
  instalacionId: number;
  empresaId: number;
  clienteId: number;
  servicioInternetId: number | null;
  acceso: AccesoInstalacionEntrada;
};

export type PrepararPrealtaParams = {
  instalacionId: number;
  empresaId: number;
  clienteId: number;
  servicioInternetId: number;
  accesoInternetId: number;
  mikrotikRouterId: number;
  operadorId: number;
};

export const PREALTA_NO_APLICA: PrealtaPppoeNoAplicaResult = {
  aplica: false,
  estado: EstadoResultadoPrealtaPppoe.NO_APLICA,
  cuentaPppoeId: null,
  perfilHomologacionId: null,
  usuario: null,
  estadoCuenta: null,
  generadoEn: null,
  mensaje: null,
  reintentable: false,
};

/**
 * Deja ligado a la instalación el acceso de internet (nuevo o existente) y
 * prepara la prealta PPPoE de los accesos GPON/PPPoE nuevos.
 */
@Injectable()
export class ProvisionarAccesoInstalacionService {
  private readonly logger = new Logger(
    ProvisionarAccesoInstalacionService.name,
  );

  constructor(
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(CLIENTE_INSTALACION_ACCESO_REPOSITORY)
    private readonly vinculos: ClienteInstalacionAccesoRepositoryPort,

    @Inject(PPPOE_PREALTA)
    private readonly prealta: PppoePrealtaPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  /**
   * Crea el acceso (modo NUEVO) o verifica el del cliente (EXISTENTE) y lo
   * vincula a la instalación. Solo escribe en base de datos: va dentro de la
   * unidad de trabajo de quien lo llama.
   */
  async vincularAcceso(
    params: VincularAccesoParams,
  ): Promise<ClienteInstalacionAccesoResult> {
    const { acceso } = params;

    if (acceso.modo === ModoAccesoInstalacion.EXISTENTE) {
      const existente = await this.accesosInternet.buscarDelCliente({
        accesoInternetId: acceso.accesoInternetId,
        clienteId: params.clienteId,
      });

      if (!existente?.id) {
        throw new ClienteInstalacionAccesoNoEncontradoError();
      }

      await this.vincular(
        params.instalacionId,
        existente.id,
        AccionInstalacionAcceso.MODIFICADO,
      );

      return {
        accesoInternetId: existente.id,
        modo: ModoAccesoInstalacion.EXISTENTE,
        tecnologia: existente.tecnologia,
        metodoAutenticacion: existente.metodoAutenticacion,
        mikrotikRouterId: null,
      };
    }

    const creado = await this.accesosInternet.crear({
      empresaId: params.empresaId,
      clienteId: params.clienteId,
      servicioInternetId: params.servicioInternetId,
      tecnologia: acceso.tecnologia,
      metodoAutenticacion: acceso.metodoAutenticacion,
    });

    if (!creado.id) {
      throw new Error('El acceso creado no tiene un identificador persistido.');
    }

    await this.vincular(
      params.instalacionId,
      creado.id,
      AccionInstalacionAcceso.CREADO,
    );

    return {
      accesoInternetId: creado.id,
      modo: ModoAccesoInstalacion.NUEVO,
      tecnologia: creado.tecnologia,
      metodoAutenticacion: creado.metodoAutenticacion,
      mikrotikRouterId: acceso.mikrotikRouterId ?? null,
    };
  }

  /**
   * Intenta preparar la cuenta PPPoE del acceso. Un fallo no se propaga: se
   * devuelve FALLIDA y reintentable para que la pantalla ofrezca "Dar prealta".
   */
  async prepararPrealta(
    params: PrepararPrealtaParams,
  ): Promise<PrealtaPppoeInstalacionResult> {
    this.logger.log(
      `Preparando prealta GPON/PPPoE del acceso ${params.accesoInternetId}.`,
    );

    try {
      const resultado = await this.prealta.preparar({
        instalacionId: params.instalacionId,
        empresaId: params.empresaId,
        clienteId: params.clienteId,
        servicioInternetId: params.servicioInternetId,
        accesoInternetId: params.accesoInternetId,
        mikrotikRouterId: params.mikrotikRouterId,
        operadorId: params.operadorId,
        operadorNombre: null,
        ipOrigen: null,
        userAgent: null,
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
    } catch (error: unknown) {
      this.logger.error(
        `Falló la prealta GPON/PPPoE del acceso ${params.accesoInternetId}.`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        aplica: true,
        estado: EstadoResultadoPrealtaPppoe.FALLIDA,
        cuentaPppoeId: null,
        perfilHomologacionId: null,
        usuario: null,
        estadoCuenta: null,
        generadoEn: null,
        mensaje: this.mensajeSeguro(error),
        reintentable: true,
      };
    }
  }

  /** Solo el mensaje de un error de dominio está escrito para el usuario (§4.5). */
  private mensajeSeguro(error: unknown): string {
    if (error instanceof DomainError) {
      return error.message;
    }

    return 'No fue posible completar la prealta PPPoE. La instalación y el acceso fueron creados correctamente.';
  }

  private async vincular(
    instalacionId: number,
    accesoInternetId: number,
    accion: AccionInstalacionAcceso,
  ): Promise<void> {
    const existente = await this.vinculos.findByInstalacionAndAcceso({
      instalacionId,
      accesoInternetId,
    });

    if (existente) {
      throw new ClienteInstalacionAccesoDuplicadoError();
    }

    const vinculo = await this.vinculos.create(
      ClienteInstalacionAccesoEntity.create(
        { instalacionId, accesoInternetId, accion },
        this.reloj.ahora(),
      ),
    );

    this.logger.log(
      `Acceso ${accesoInternetId} vinculado a la instalación ${instalacionId}. Relación: ${vinculo.id}.`,
    );
  }
}
