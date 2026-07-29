import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';
import { AutorizarPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/autorizar-pppoe-operacion.use-case';
import { CancelarPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/cancelar-pppoe-operacion.use-case';
import {
  ListarPppoeOperacionesUseCase,
  ListarPppoeOperacionesUseCaseInput,
} from 'src/modules/pppoe-operacion/application/use-cases/listar-pppoe-operaciones.use-case';
import { ObtenerDetallePppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/obtener-detalle-pppoe-operacion.use-case';
import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';
import {
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from '../../domain/ports/pppoe-provisionamiento.port';
import { EjecutarOperacionPppoeResult } from '../../domain/props/pppoe-provisionamiento.props';
import { EjecutarPppoeOperacionUseCase } from '../use-cases/ejecutar-pppoe-operacion.use-case';
import { RecuperarPppoeOperacionInterrumpidaUseCase } from '../use-cases/recuperar-pppoe-operacion-interrumpida.use-case';

export type ActorAdministrativoPppoe = {
  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

export type AutorizarYEjecutarPppoeAdminParams = {
  empresaId: number;

  operacionId: number;

  password: string;

  actor: ActorAdministrativoPppoe;
};

export type CancelarPppoeAdminParams = {
  empresaId: number;

  operacionId: number;

  motivo: string;

  actor: ActorAdministrativoPppoe;
};

export type ReintentarPppoeAdminParams = {
  empresaId: number;

  operacionId: number;

  claveIdempotencia: string;

  motivo?: string | null;

  actor: ActorAdministrativoPppoe;
};

export type RecuperarPppoeAdminParams = {
  empresaId: number;

  operacionId: number;

  confirmarAbandono: true;

  fecha?: Date;

  actor: ActorAdministrativoPppoe;
};

export type SuspenderPppoeManualParams = {
  empresaId: number;

  cuentaPppoeId: number;

  instalacionId?: number | null;

  claveIdempotencia: string;

  motivo?: string | null;

  actor: ActorAdministrativoPppoe;
};

/**
 * Fachada de aplicación para las acciones administrativas
 * sobre operaciones PPPoE.
 *
 * El controlador no conoce repositorios, SSH ni entidades
 * internas de provisionamiento.
 */
@Injectable()
export class PppoeOperacionAdminService {
  constructor(
    private readonly listarOperacionesUseCase: ListarPppoeOperacionesUseCase,

    private readonly obtenerDetalleUseCase: ObtenerDetallePppoeOperacionUseCase,

    private readonly autorizarOperacionUseCase: AutorizarPppoeOperacionUseCase,

    private readonly cancelarOperacionUseCase: CancelarPppoeOperacionUseCase,

    private readonly ejecutarOperacionUseCase: EjecutarPppoeOperacionUseCase,

    private readonly recuperarOperacionUseCase: RecuperarPppoeOperacionInterrumpidaUseCase,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly provisionamiento: PppoeProvisionamientoPort,
  ) {}

  listar(input: ListarPppoeOperacionesUseCaseInput) {
    return this.listarOperacionesUseCase.execute(input);
  }

  obtenerDetalle(params: {
    empresaId: number;

    operacionId: number;
  }) {
    return this.obtenerDetalleUseCase.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });
  }

  /**
   * Autoriza mediante contraseña y comienza
   * inmediatamente la operación protegida.
   *
   * Esto evita dejar una operación AUTORIZADA
   * sin un mecanismo posterior para ejecutarla.
   */
  async autorizarYEjecutar(
    params: AutorizarYEjecutarPppoeAdminParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    const operacion = await this.autorizarOperacionUseCase.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      operadorId: params.actor.operadorId,

      password: params.password,
    });

    const operacionId = this.requireOperationId(operacion);

    return this.ejecutarOperacionUseCase.execute({
      empresaId: params.empresaId,

      operacionId,
    });
  }

  /**
   * Cancela una operación que todavía no comenzó.
   */
  async cancelar(params: CancelarPppoeAdminParams) {
    this.validateActor(params.actor);

    const aggregate = await this.cancelarOperacionUseCase.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      motivo: params.motivo,
    });

    const operacionId = this.requireOperationId(aggregate.operacion);

    /*
     * Se devuelve el read model enriquecido,
     * no la entidad de dominio directamente.
     */
    return this.obtenerDetalleUseCase.execute({
      empresaId: params.empresaId,

      operacionId,
    });
  }

  /**
   * Genera un intento nuevo y ejecuta el flujo técnico.
   */
  reintentar(
    params: ReintentarPppoeAdminParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    return this.provisionamiento.reintentarOperacion({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      claveIdempotencia: params.claveIdempotencia,

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: params.actor.operadorId,

        operadorNombre: params.actor.operadorNombre ?? null,

        ipOrigen: params.actor.ipOrigen ?? null,

        userAgent: params.actor.userAgent ?? null,
      },

      motivo: params.motivo ?? null,
    });
  }

  /**
   * Cierra una operación EJECUTANDO que fue confirmada
   * como abandonada.
   *
   * No vuelve a ejecutar SSH.
   */
  recuperar(
    params: RecuperarPppoeAdminParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    return this.recuperarOperacionUseCase.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      confirmarAbandono: params.confirmarAbandono,

      fecha: params.fecha,
    });
  }

  /**
   * Suspensión administrativa manual.
   *
   * No depende de cobranza ni facturación.
   */
  suspenderManual(
    params: SuspenderPppoeManualParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    return this.provisionamiento.suspenderServicio({
      empresaId: params.empresaId,

      cuentaPppoeId: params.cuentaPppoeId,

      instalacionId: params.instalacionId ?? null,

      claveIdempotencia: params.claveIdempotencia,

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: params.actor.operadorId,

        operadorNombre: params.actor.operadorNombre ?? null,

        ipOrigen: params.actor.ipOrigen ?? null,

        userAgent: params.actor.userAgent ?? null,
      },

      motivo: params.motivo ?? 'Suspensión manual del servicio PPPoE.',
    });
  }

  private requireOperationId(operacion: PppoeOperacionEntity): number {
    if (operacion.id === null) {
      throw new ConflictException(
        'La operación PPPoE autorizada no contiene identificador persistido.',
      );
    }

    return operacion.id;
  }

  private validateActor(actor: ActorAdministrativoPppoe): void {
    if (!actor) {
      throw new BadRequestException('El actor administrativo es obligatorio.');
    }

    if (!Number.isInteger(actor.operadorId) || actor.operadorId <= 0) {
      throw new BadRequestException(
        'actor.operadorId debe ser un entero positivo.',
      );
    }
  }
}
