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
import { AuthService } from 'src/auth/auth.service';
import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

/**
 * Contexto funcional de una operación ELIMINAR_SECRET.
 *
 * No se persiste en base de datos.
 *
 * Se deriva de las relaciones ya existentes:
 *
 * DESINSTALACION
 *   desinstalacionId != null
 *
 * BAJA_MANUAL
 *   instalacionId = null
 *   desinstalacionId = null
 *
 * CONTEXTO_INVALIDO
 *   combinación que no corresponde a ninguno
 *   de los flujos soportados.
 */
export enum ContextoEliminacionPppoe {
  DESINSTALACION = 'DESINSTALACION',

  BAJA_MANUAL = 'BAJA_MANUAL',

  CONTEXTO_INVALIDO = 'CONTEXTO_INVALIDO',
}

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

  /**
   * Solo será obligatoria cuando el intento
   * corresponda a una baja manual definitiva.
   *
   * Nunca se envía al motor PPPoE.
   */
  contrasenaActual?: string | null;

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

  claveIdempotencia: string;

  motivo: string;

  contrasenaActual: string;

  actor: ActorAdministrativoPppoe;
};

export type ReactivarPppoeManualParams = {
  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  contrasenaActual: string;

  motivo: string;

  actor: ActorAdministrativoPppoe;
};

type AccionManualCuentaPppoeBaseParams = {
  empresaId: number;

  cuentaPppoeId: number;

  motivo: string;
};

type AccionManualCuentaPppoeConIdempotenciaParams =
  AccionManualCuentaPppoeBaseParams & {
    claveIdempotencia: string;
  };

type AccionManualCuentaPppoeParams = {
  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  motivo: string;
};

export type DarDeBajaPppoeManualParams = {
  empresaId: number;

  cuentaPppoeId: number;

  /**
   * La baja es definitiva, por lo que el motivo
   * administrativo es obligatorio.
   */
  motivo: string;

  /**
   * Se utiliza únicamente para reautenticar
   * al operador administrativo.
   *
   * Nunca debe enviarse al motor PPPoE.
   */
  contrasenaActual: string;

  actor: ActorAdministrativoPppoe;
};

/**
 *
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

    private readonly authService: AuthService,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly provisionamiento: PppoeProvisionamientoPort,
  ) {}

  /**
   * Lista operaciones administrativas enriquecidas.
   *
   * contextoEliminacion es un dato derivado y no
   * requiere persistencia adicional.
   */
  async listar(input: ListarPppoeOperacionesUseCaseInput) {
    const result = await this.listarOperacionesUseCase.execute(input);

    return {
      ...result,

      data: result.data.map((operacion) => ({
        ...operacion,

        contextoEliminacion: this.resolveDeletionContext(operacion),
      })),
    };
  }

  /**
   * Obtiene el detalle administrativo enriquecido.
   */
  async obtenerDetalle(params: {
    empresaId: number;

    operacionId: number;
  }) {
    const operacion = await this.obtenerDetalleUseCase.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    return {
      ...operacion,

      contextoEliminacion: this.resolveDeletionContext(operacion),
    };
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
  /**
   * Genera un intento nuevo y ejecuta el flujo técnico.
   *
   * Las operaciones administrativas destructivas de
   * BAJA MANUAL requieren una nueva reautenticación
   * antes de cada nuevo intento.
   *
   * Una baja manual se identifica por:
   *
   * - tipo = ELIMINAR_SECRET;
   * - instalacionId = null;
   * - desinstalacionId = null.
   *
   * Esto no afecta los reintentos del flujo formal
   * ClienteDesinstalacion.
   */
  /**
   * Genera un intento nuevo y ejecuta el flujo técnico.
   *
   * Una BAJA MANUAL exige una nueva reautenticación
   * antes de cada nuevo intento.
   */
  async reintentar(
    params: ReintentarPppoeAdminParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    this.validateRetryRequest(params);

    /*
     * Puede recibirse la operación raíz o cualquier
     * intento perteneciente a la cadena.
     */
    const operacion = await this.obtenerDetalleUseCase.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    const contextoEliminacion = this.resolveDeletionContext(operacion);

    /*
     * No dejamos continuar datos históricos o futuros
     * que representen un ELIMINAR_SECRET con una
     * combinación estructural no reconocida.
     */
    if (contextoEliminacion === ContextoEliminacionPppoe.CONTEXTO_INVALIDO) {
      throw new ConflictException(
        'La operación ELIMINAR_SECRET contiene un contexto funcional inválido y no puede reintentarse automáticamente.',
      );
    }

    /*
     * Una baja manual es una operación destructiva
     * independiente de ClienteDesinstalacion.
     *
     * Cada nuevo intento vuelve a confirmar la
     * identidad del operador.
     */
    if (contextoEliminacion === ContextoEliminacionPppoe.BAJA_MANUAL) {
      this.validateManualTerminationRetryPassword(params.contrasenaActual);

      await this.authService.reautenticarUsuarioPorId(
        params.actor.operadorId,

        params.contrasenaActual!,
      );
    }

    return this.provisionamiento.reintentarOperacion({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      claveIdempotencia: params.claveIdempotencia.trim(),

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
   * Suspende manualmente una cuenta PPPoE.
   *
   * La acción no depende de instalación, cobranza
   * ni facturación.
   */
  /**
   * Suspende manualmente una cuenta PPPoE.
   *
   * La acción no depende de instalación, cobranza
   * ni facturación.
   */
  async suspenderManual(
    params: SuspenderPppoeManualParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    this.validateManualAccountAction(params, 'suspensión');
    await this.authService.reautenticarUsuarioPorId(
      params.actor.operadorId,
      params.contrasenaActual,
    );

    return this.provisionamiento.suspenderServicio({
      empresaId: params.empresaId,

      cuentaPppoeId: params.cuentaPppoeId,

      claveIdempotencia: params.claveIdempotencia.trim(),

      motivo: params.motivo.trim(),

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: params.actor.operadorId,

        operadorNombre: params.actor.operadorNombre ?? null,

        ipOrigen: params.actor.ipOrigen ?? null,

        userAgent: params.actor.userAgent ?? null,
      },
    });
  }

  /**
   * Reactiva manualmente una cuenta PPPoE suspendida.
   *
   * No pertenece al flujo de instalación.
   */
  async reactivarManual(
    params: ReactivarPppoeManualParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    this.validateManualAccountAction(params, 'reactivación');

    await this.authService.reautenticarUsuarioPorId(
      params.actor.operadorId,
      params.contrasenaActual,
    );

    return this.provisionamiento.reactivarServicio({
      empresaId: params.empresaId,

      cuentaPppoeId: params.cuentaPppoeId,

      claveIdempotencia: params.claveIdempotencia.trim(),

      motivo: params.motivo.trim(),

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: params.actor.operadorId,

        ipOrigen: params.actor.ipOrigen ?? null,

        userAgent: params.actor.userAgent ?? null,
      },
    });
  }

  /**
   * Da de baja definitivamente una cuenta PPPoE
   * sin crear ClienteDesinstalacion.
   *
   * Diferencia respecto a suspenderManual():
   *
   * SUSPENSION
   *   - reversible;
   *   - conserva el secret;
   *   - permite reactivación.
   *
   * BAJA MANUAL
   *   - definitiva para este ciclo de acceso;
   *   - elimina el secret del MikroTik;
   *   - elimina sesiones activas;
   *   - termina con cuenta ELIMINADA;
   *   - termina con acceso BAJA.
   *
   * La contraseña se utiliza exclusivamente en esta
   * fachada administrativa para reautenticar al actor.
   *
   * Nunca se propaga al puerto ni al motor PPPoE.
   */
  async darDeBajaManual(
    params: DarDeBajaPppoeManualParams,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateActor(params.actor);

    this.validateManualTermination(params);

    /*
     * Operación destructiva:
     *
     * confirmamos nuevamente la identidad del operador
     * antes de crear o ejecutar ELIMINAR_SECRET.
     */
    await this.authService.reautenticarUsuarioPorId(
      params.actor.operadorId,
      params.contrasenaActual,
    );

    /*
     * La idempotencia pertenece al backend.
     *
     * Existe una única intención de baja definitiva
     * para este ciclo de vida de la cuenta.
     *
     * Si la operación técnica falla, deberá utilizarse
     * el flujo explícito de reintento en lugar de crear
     * otra operación de baja independiente.
     */
    const claveIdempotencia = this.buildManualTerminationIdempotencyKey({
      empresaId: params.empresaId,

      cuentaPppoeId: params.cuentaPppoeId,
    });

    return this.provisionamiento.darDeBajaServicio({
      empresaId: params.empresaId,

      cuentaPppoeId: params.cuentaPppoeId,

      claveIdempotencia,

      motivo: params.motivo.trim(),

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: params.actor.operadorId,

        operadorNombre: params.actor.operadorNombre ?? null,

        ipOrigen: params.actor.ipOrigen ?? null,

        userAgent: params.actor.userAgent ?? null,
      },
    });
  }

  /**
   * Valida la solicitud administrativa de baja
   * antes de realizar la reautenticación.
   *
   * Las reglas de estado de la cuenta pertenecen
   * posteriormente al caso de uso de eliminación.
   */
  private validateManualTermination(
    params: AccionManualCuentaPppoeBaseParams & {
      contrasenaActual: string;
    },
  ): void {
    if (!Number.isInteger(params.empresaId) || params.empresaId <= 0) {
      throw new BadRequestException('empresaId debe ser un entero positivo.');
    }

    if (!Number.isInteger(params.cuentaPppoeId) || params.cuentaPppoeId <= 0) {
      throw new BadRequestException(
        'cuentaPppoeId debe ser un entero positivo.',
      );
    }

    if (typeof params.motivo !== 'string' || params.motivo.trim().length < 5) {
      throw new BadRequestException(
        'El motivo de baja debe contener al menos 5 caracteres.',
      );
    }

    if (
      typeof params.contrasenaActual !== 'string' ||
      !params.contrasenaActual.trim()
    ) {
      throw new BadRequestException(
        'La contraseña actual es obligatoria para dar de baja la cuenta PPPoE.',
      );
    }
  }

  /**
   * Genera una clave determinista para la baja definitiva.
   *
   * No depende del navegador ni del controlador.
   *
   * Una misma cuenta solamente puede originar una
   * intención inicial de baja manual.
   *
   * Los fallos posteriores se resuelven mediante
   * el flujo formal de reintentos PPPoE.
   */
  private buildManualTerminationIdempotencyKey(params: {
    empresaId: number;

    cuentaPppoeId: number;
  }): string {
    return [
      'pppoe-baja-manual',
      `empresa:${params.empresaId}`,
      `cuenta:${params.cuentaPppoeId}`,
      'eliminar-secret',
      'v1',
    ].join(':');
  }

  /**
   * Validaciones comunes para acciones administrativas
   * directas sobre una cuenta PPPoE.
   */
  private validateManualAccountAction(
    params: AccionManualCuentaPppoeConIdempotenciaParams,
    accion: 'suspensión' | 'reactivación',
  ): void {
    if (!Number.isInteger(params.empresaId) || params.empresaId <= 0) {
      throw new BadRequestException('empresaId debe ser un entero positivo.');
    }

    if (!Number.isInteger(params.cuentaPppoeId) || params.cuentaPppoeId <= 0) {
      throw new BadRequestException(
        'cuentaPppoeId debe ser un entero positivo.',
      );
    }

    if (
      typeof params.claveIdempotencia !== 'string' ||
      !params.claveIdempotencia.trim()
    ) {
      throw new BadRequestException('claveIdempotencia es obligatoria.');
    }

    if (typeof params.motivo !== 'string' || params.motivo.trim().length < 5) {
      throw new BadRequestException(
        `El motivo de ${accion} debe contener al menos 5 caracteres.`,
      );
    }
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

  /**
   * Determina el contexto funcional de
   * ELIMINAR_SECRET sin depender:
   *
   * - del motivo;
   * - de la clave idempotente;
   * - de nombres;
   * - de convenciones del frontend.
   *
   * Se utilizan únicamente datos estructurados
   * persistidos en PppoeOperacion.
   */
  private resolveDeletionContext(params: {
    tipo: TipoOperacionPppoe;

    instalacionId: number | null;

    desinstalacionId: number | null;
  }): ContextoEliminacionPppoe | null {
    if (params.tipo !== TipoOperacionPppoe.ELIMINAR_SECRET) {
      return null;
    }

    /*
     * Flujo formal de desinstalación.
     */
    if (params.instalacionId === null && params.desinstalacionId !== null) {
      return ContextoEliminacionPppoe.DESINSTALACION;
    }

    /*
     * Baja administrativa independiente.
     */
    if (params.instalacionId === null && params.desinstalacionId === null) {
      return ContextoEliminacionPppoe.BAJA_MANUAL;
    }

    /*
     * Por ejemplo:
     *
     * instalacionId != null
     * desinstalacionId == null
     *
     * Una instalación por sí sola nunca debe
     * originar ELIMINAR_SECRET.
     */
    return ContextoEliminacionPppoe.CONTEXTO_INVALIDO;
  }

  /**
   * Una nueva ejecución de BAJA MANUAL debe confirmar
   * nuevamente la identidad del operador.
   */
  private validateManualTerminationRetryPassword(
    contrasenaActual: string | null | undefined,
  ): void {
    if (typeof contrasenaActual !== 'string' || !contrasenaActual.trim()) {
      throw new BadRequestException(
        'La contraseña actual es obligatoria para reintentar una baja manual PPPoE.',
      );
    }
  }

  /**
   * Validaciones administrativas básicas antes de
   * consultar o crear el nuevo intento.
   */
  private validateRetryRequest(params: ReintentarPppoeAdminParams): void {
    if (!Number.isInteger(params.empresaId) || params.empresaId <= 0) {
      throw new BadRequestException('empresaId debe ser un entero positivo.');
    }

    if (!Number.isInteger(params.operacionId) || params.operacionId <= 0) {
      throw new BadRequestException('operacionId debe ser un entero positivo.');
    }

    if (
      typeof params.claveIdempotencia !== 'string' ||
      !params.claveIdempotencia.trim()
    ) {
      throw new BadRequestException('claveIdempotencia es obligatoria.');
    }

    if (params.claveIdempotencia.trim().length > 200) {
      throw new BadRequestException(
        'claveIdempotencia no puede superar 200 caracteres.',
      );
    }
  }
}
