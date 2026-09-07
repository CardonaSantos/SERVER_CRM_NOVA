import { BadRequestException, Injectable } from '@nestjs/common';

import { AuthService } from 'src/auth/auth.service';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { PrepararPrealtaPppoeResult } from '../results/preparar-prealta-pppoe.result';

import { CrearPrealtaPppoeClienteUseCase } from '../use-cases/crear-prealta-pppoe-cliente.use-case';

import {
  ProvisionarPppoeClienteManualResult,
  ProvisionarPppoeClienteManualUseCase,
} from '../use-cases/provisionar-pppoe-cliente-manual.use-case';

/**
 * Actor administrativo obtenido exclusivamente
 * de la petición autenticada.
 */
export type ActorProvisionamientoPppoeAdmin = {
  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

/**
 * Preparación administrativa de una cuenta PPPoE.
 *
 * Todavía no ejecuta comandos contra MikroTik.
 */
export type CrearPrealtaPppoeClienteManualParams = {
  empresaId: number;

  clienteId: number;

  servicioInternetId: number;

  mikrotikRouterId: number;

  actor: ActorProvisionamientoPppoeAdmin;
};

/**
 * Primera provisión real de una cuenta PPPoE
 * previamente preparada.
 */
export type ProvisionarPppoeClienteManualParams = {
  empresaId: number;

  cuentaPppoeId: number;

  contrasenaActual: string;

  motivo?: string | null;

  actor: ActorProvisionamientoPppoeAdmin;
};

/**
 * Fachada administrativa para crear y provisionar
 * cuentas PPPoE fuera del flujo de instalación.
 *
 * Responsabilidades:
 *
 * - validar contexto administrativo;
 * - preparar acceso y cuenta PPPoE;
 * - reautenticar antes de modificar MikroTik;
 * - delegar la ejecución técnica a los use cases existentes.
 *
 * No conoce:
 *
 * - comandos RouterOS;
 * - sesiones SSH;
 * - credenciales PPPoE cifradas;
 * - detalles de persistencia.
 */
@Injectable()
export class PppoeCuentaProvisionamientoAdminService {
  constructor(
    private readonly crearPrealtaUseCase: CrearPrealtaPppoeClienteUseCase,

    private readonly provisionarUseCase: ProvisionarPppoeClienteManualUseCase,

    private readonly authService: AuthService,
  ) {}

  /**
   * Crea o recupera la prealta administrativa.
   *
   * Esta operación únicamente afecta el estado local.
   * No necesita reautenticación porque todavía
   * no ejecuta acciones sobre MikroTik.
   */
  crearPrealta(
    params: CrearPrealtaPppoeClienteManualParams,
  ): Promise<PrepararPrealtaPppoeResult> {
    this.validateActor(params.actor);

    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.clienteId, 'clienteId');

    this.assertPositiveInteger(params.servicioInternetId, 'servicioInternetId');

    this.assertPositiveInteger(params.mikrotikRouterId, 'mikrotikRouterId');

    return this.crearPrealtaUseCase.execute({
      empresaId: params.empresaId,

      clienteId: params.clienteId,

      servicioInternetId: params.servicioInternetId,

      mikrotikRouterId: params.mikrotikRouterId,

      operadorId: params.actor.operadorId,

      operadorNombre: params.actor.operadorNombre ?? null,

      ipOrigen: params.actor.ipOrigen ?? null,

      userAgent: params.actor.userAgent ?? null,
    });
  }

  /**
   * Ejecuta la primera provisión real de la cuenta.
   *
   * Antes de cualquier operación SSH se valida
   * nuevamente la contraseña del operador.
   */
  async provisionar(
    params: ProvisionarPppoeClienteManualParams,
  ): Promise<ProvisionarPppoeClienteManualResult> {
    this.validateActor(params.actor);

    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

    if (
      typeof params.contrasenaActual !== 'string' ||
      params.contrasenaActual.length === 0
    ) {
      throw new BadRequestException('contrasenaActual es obligatoria.');
    }

    /*
     * La contraseña únicamente sirve para confirmar
     * nuevamente la identidad del operador.
     *
     * No se transmite a los use cases PPPoE ni se
     * almacena en auditorías u operaciones.
     */
    await this.authService.reautenticarUsuarioPorId(
      params.actor.operadorId,
      params.contrasenaActual,
    );

    return this.provisionarUseCase.execute({
      empresaId: params.empresaId,

      cuentaPppoeId: params.cuentaPppoeId,

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: params.actor.operadorId,

        operadorNombre: params.actor.operadorNombre ?? null,

        ipOrigen: params.actor.ipOrigen ?? null,

        userAgent: params.actor.userAgent ?? null,
      },

      motivo: params.motivo?.trim() || null,
    });
  }

  private validateActor(actor: ActorProvisionamientoPppoeAdmin): void {
    if (!actor) {
      throw new BadRequestException('El actor administrativo es obligatorio.');
    }

    this.assertPositiveInteger(actor.operadorId, 'actor.operadorId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
