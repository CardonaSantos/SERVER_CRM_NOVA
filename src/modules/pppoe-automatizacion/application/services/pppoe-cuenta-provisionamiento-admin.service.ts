import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthService } from 'src/auth/auth.service';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { PrepararPrealtaPppoeResult } from '../results/preparar-prealta-pppoe.result';

import { CrearPrealtaPppoeClienteUseCase } from '../use-cases/crear-prealta-pppoe-cliente.use-case';

import {
  ProvisionarPppoeClienteManualResult,
  ProvisionarPppoeClienteManualUseCase,
} from '../use-cases/provisionar-pppoe-cliente-manual.use-case';

export type ActorProvisionamientoPppoeAdmin = {
  operadorId: number;

  operadorNombre?: string | null;

  /**
   * Rol obtenido exclusivamente del JWT.
   *
   * Nunca debe recibirse desde el body.
   */
  actorRol: string;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

export type CrearPrealtaPppoeClienteManualParams = {
  empresaId: number;

  clienteId: number;

  servicioInternetId: number;

  mikrotikRouterId: number;

  actor: ActorProvisionamientoPppoeAdmin;
};

export type ProvisionarPppoeClienteManualParams = {
  empresaId: number;

  cuentaPppoeId: number;

  contrasenaActual: string;

  motivo?: string | null;

  actor: ActorProvisionamientoPppoeAdmin;
};

/**
 * Fachada administrativa para crear y provisionar
 * cuentas PPPoE fuera de ClienteInstalacion.
 *
 * Esta capa representa una operación administrativa
 * sensible, por lo que valida:
 *
 * - empresa desde JWT;
 * - operador desde JWT;
 * - rol administrativo;
 * - reautenticación antes de tocar MikroTik.
 *
 * La contraseña de reautenticación termina aquí.
 */
@Injectable()
export class PppoeCuentaProvisionamientoAdminService {
  constructor(
    private readonly crearPrealtaUseCase: CrearPrealtaPppoeClienteUseCase,

    private readonly provisionarUseCase: ProvisionarPppoeClienteManualUseCase,

    private readonly authService: AuthService,
  ) {}

  /**
   * Prepara acceso y cuenta PPPoE localmente.
   *
   * No ejecuta SSH, pero sigue siendo una operación
   * administrativa: crea una identidad PPPoE para
   * un cliente existente.
   */
  crearPrealta(
    params: CrearPrealtaPppoeClienteManualParams,
  ): Promise<PrepararPrealtaPppoeResult> {
    this.validateActor(params.actor);

    this.assertOfficeRole(params.actor.actorRol);

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
   * Ejecuta la primera activación real
   * de una cuenta ALTA_MANUAL.
   *
   * Antes de delegar cualquier operación PPPoE
   * se vuelve a autenticar al operador.
   */
  async provisionar(
    params: ProvisionarPppoeClienteManualParams,
  ): Promise<ProvisionarPppoeClienteManualResult> {
    this.validateActor(params.actor);

    this.assertOfficeRole(params.actor.actorRol);

    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

    /**
     * No aplicar trim().
     *
     * Una contraseña puede contener espacios
     * intencionalmente.
     */
    if (
      typeof params.contrasenaActual !== 'string' ||
      params.contrasenaActual.length === 0
    ) {
      throw new BadRequestException('contrasenaActual es obligatoria.');
    }

    /**
     * La contraseña existe únicamente durante
     * la reautenticación.
     *
     * No pasa a:
     *
     * - use cases PPPoE;
     * - operaciones;
     * - auditorías;
     * - ejecutores SSH.
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

    if (
      typeof actor.actorRol !== 'string' ||
      actor.actorRol.trim().length === 0
    ) {
      throw new ForbiddenException(
        'No fue posible determinar el rol del operador.',
      );
    }
  }

  /**
   * Conservamos la misma política utilizada
   * por la activación PPPoE desde instalaciones.
   */
  private assertOfficeRole(actorRol: string): void {
    const rol = actorRol.trim().toUpperCase();

    if (rol === 'OFICINA' || rol === 'ADMIN' || rol === 'SUPER_ADMIN') {
      return;
    }

    throw new ForbiddenException(
      'El operador no posee permisos para administrar altas PPPoE.',
    );
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
