import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { CrearReintentoPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/crear-reintento-pppoe-operacion.use-case';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import { PppoeProvisionamientoPort } from '../../domain/ports/pppoe-provisionamiento.port';

import {
  ActivarSecretPppoeInput,
  CrearSecretPppoeInput,
  EjecutarOperacionPppoeResult,
  EliminarSecretPppoeInput,
  ReintentarOperacionPppoeInput,
  SuspenderServicioPppoeInput,
} from '../../domain/props/pppoe-provisionamiento.props';

import { CrearYEjecutarOperacionPppoeUseCase } from '../use-cases/crear-y-ejecutar-operacion-pppoe.use-case';

import { CrearYEjecutarActivacionPppoeUseCase } from '../use-cases/crear-y-ejecutar-activacion-pppoe.use-case';

import { CrearYEjecutarSuspensionPppoeUseCase } from '../use-cases/crear-y-ejecutar-suspension-pppoe.use-case';

import { EjecutarPppoeOperacionUseCase } from '../use-cases/ejecutar-pppoe-operacion.use-case';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../../domain/ports/pppoe-operacion-auditoria.port';
import { CrearYEjecutarEliminacionPppoeUseCase } from '../use-cases/crear-y-ejecutar-eliminacion-pppoe.use-case';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionRepositoryPort,
} from 'src/modules/pppoe-operacion/domain/ports/pppoe-operacion-repository.port';

import { MIKROTIK_ROUTER_CONNECTION_CONTEXT } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';

import { MikrotikRouterConnectionContextPort } from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';

/**
 * Implementación de la fachada pública
 * de provisionamiento PPPoE.
 *
 * Los módulos consumidores no conocen:
 *
 * - sesiones SSH;
 * - comandos RouterOS;
 * - pasos técnicos;
 * - credenciales cifradas;
 * - repositorios internos.
 */
@Injectable()
export class PppoeProvisionamientoService implements PppoeProvisionamientoPort {
  constructor(
    private readonly crearSecretUseCase: CrearYEjecutarOperacionPppoeUseCase,

    private readonly activarSecretUseCase: CrearYEjecutarActivacionPppoeUseCase,

    private readonly suspenderServicioUseCase: CrearYEjecutarSuspensionPppoeUseCase,

    private readonly eliminarSecretUseCase: CrearYEjecutarEliminacionPppoeUseCase,

    private readonly crearReintentoUseCase: CrearReintentoPppoeOperacionUseCase,

    private readonly ejecutarOperacionUseCase: EjecutarPppoeOperacionUseCase,

    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly operacionRepository: PppoeOperacionRepositoryPort,

    @Inject(MIKROTIK_ROUTER_CONNECTION_CONTEXT)
    private readonly routerContext: MikrotikRouterConnectionContextPort,

    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,
  ) {}

  /**
   * Crea o confirma el secret en estado deshabilitado.
   */
  crearSecret(
    input: CrearSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    return this.crearSecretUseCase.execute(input);
  }

  /**
   * Habilita o confirma habilitado el secret.
   */
  activarSecret(
    input: ActivarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    return this.activarSecretUseCase.execute(input);
  }

  /**
   * Deshabilita el secret y remueve sesiones activas.
   */
  suspenderServicio(
    input: SuspenderServicioPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    return this.suspenderServicioUseCase.execute(input);
  }

  /**
   * Elimina definitivamente el secret durante
   * una desinstalación autorizada.
   */
  eliminarSecret(
    input: EliminarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    return this.eliminarSecretUseCase.execute(input);
  }

  /**
   * Crea un intento nuevo a partir del último intento
   * FALLIDO o PARCIAL y lo ejecuta.
   *
   * Nunca reutiliza la operación anterior.
   */
  async reintentarOperacion(
    input: ReintentarOperacionPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateRetryInput(input);

    const routerSnapshot = await this.resolveCurrentRetryRouterSnapshot({
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    const aggregate = await this.crearReintentoUseCase.execute({
      empresaId: input.empresaId,

      operacionId: input.operacionId,

      claveIdempotencia: input.claveIdempotencia,

      iniciadoPorId: input.actor.iniciadoPorId,

      origen: input.actor.origen,

      motivo: input.motivo,

      /*
       * El reintento captura nuevamente el destino actual.
       *
       * No copia el snapshot histórico del intento anterior.
       */
      mikrotikRouterId: routerSnapshot.mikrotikRouterId,

      routerHostSnapshot: routerSnapshot.routerHostSnapshot,

      routerPuertoSnapshot: routerSnapshot.routerPuertoSnapshot,
    });

    const operacion = aggregate.operacion;

    const operacionId = this.requireOperationId(operacion);

    if (aggregate.creada) {
      if (aggregate.operacionAnteriorId === null) {
        throw new ConflictException(
          'El nuevo reintento no contiene la referencia a la operación anterior.',
        );
      }

      await this.operacionAuditoria.registrarReintentada({
        operacion,

        operacionAnteriorId: aggregate.operacionAnteriorId,

        actor: {
          operadorId: input.actor.iniciadoPorId,

          operadorNombre: input.actor.operadorNombre ?? null,

          ipOrigen: input.actor.ipOrigen ?? null,

          userAgent: input.actor.userAgent ?? null,
        },
      });
    }

    /**
     * La misma clave puede repetirse después de que
     * el reintento ya terminó.
     */
    if (operacion.esTerminal()) {
      return this.buildExistingResult(operacion);
    }

    /**
     * Otra solicitud ya reclamó este mismo reintento.
     *
     * No repetimos comandos SSH.
     */
    if (operacion.estaEjecutando()) {
      return this.buildExistingResult(operacion);
    }

    /**
     * Una operación protegida recién creada permanecerá
     * PENDIENTE hasta que otro flujo la autorice.
     */
    if (operacion.estaPendiente() && operacion.requiereReautenticacion) {
      throw new ConflictException(
        `El reintento PPPoE ${operacionId} requiere autorización antes de ejecutarse.`,
      );
    }

    /**
     * Una operación ya AUTORIZADA puede comenzar.
     */
    if (!operacion.estaPendiente() && !operacion.estaAutorizada()) {
      throw new ConflictException(
        `El reintento PPPoE ${operacionId} no puede ejecutarse desde el estado ${operacion.estado}.`,
      );
    }

    return this.ejecutarOperacionUseCase.execute({
      empresaId: input.empresaId,

      operacionId,
    });
  }

  private async resolveCurrentRetryRouterSnapshot(params: {
    empresaId: number;

    operacionId: number;
  }): Promise<{
    mikrotikRouterId: number;

    routerHostSnapshot: string;

    routerPuertoSnapshot: number;
  }> {
    /*
     * El endpoint permite enviar la operación raíz
     * o cualquier intento perteneciente a la cadena.
     */
    const operacionSolicitada = await this.operacionRepository.findById({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    if (!operacionSolicitada) {
      throw new NotFoundException(
        `No existe la operación PPPoE ${params.operacionId}.`,
      );
    }

    const operacionRaizId =
      operacionSolicitada.reintentoDeId ??
      this.requireOperationId(operacionSolicitada);

    /*
     * El snapshot se construye para el contexto del último
     * intento de la cadena, no necesariamente para el ID
     * enviado por el controlador.
     */
    const ultimoIntento = await this.operacionRepository.findLatestAttempt({
      empresaId: params.empresaId,

      operacionRaizId,
    });

    if (!ultimoIntento) {
      throw new NotFoundException(
        `No se encontró la cadena de intentos de la operación ${operacionRaizId}.`,
      );
    }

    const router = await this.routerContext.resolve(
      ultimoIntento.mikrotikRouterId,
    );

    const host = router.host?.trim();

    if (!host) {
      throw new ConflictException(
        `El router MikroTik ${ultimoIntento.mikrotikRouterId} no contiene un host válido.`,
      );
    }

    if (
      !Number.isInteger(router.port) ||
      router.port < 1 ||
      router.port > 65_535
    ) {
      throw new ConflictException(
        `El router MikroTik ${ultimoIntento.mikrotikRouterId} no contiene un puerto SSH válido.`,
      );
    }

    return {
      mikrotikRouterId: ultimoIntento.mikrotikRouterId,

      routerHostSnapshot: host,

      routerPuertoSnapshot: router.port,
    };
  }

  /**
   * Devuelve el resultado persistido de una operación
   * que no debe volver a ejecutarse.
   */
  private async buildExistingResult(
    operacion: PppoeOperacionEntity,
  ): Promise<EjecutarOperacionPppoeResult> {
    const primitives = operacion.toPrimitives();

    const estadoCuenta = await this.findAccountStateSafely({
      empresaId: operacion.empresaId,

      cuentaPppoeId: operacion.cuentaPppoeId,
    });

    return {
      operacionId: this.requireOperationId(operacion),

      cuentaPppoeId: operacion.cuentaPppoeId,

      tipo: operacion.tipo,

      estadoOperacion: operacion.estado,

      estadoCuenta,

      numeroIntento: operacion.numeroIntento,

      reintentable: operacion.puedeReintentarse(),

      resultado: primitives.resultado,

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,
    };
  }

  /**
   * Obtiene el estado local sin sustituir el resultado
   * principal cuando la cuenta no puede consultarse.
   */
  private async findAccountStateSafely(params: {
    empresaId: number;

    cuentaPppoeId: number;
  }): Promise<EjecutarOperacionPppoeResult['estadoCuenta']> {
    try {
      const cuenta = await this.cuentaRepository.findById(params.cuentaPppoeId);

      if (!cuenta || cuenta.empresaId !== params.empresaId) {
        return null;
      }

      return cuenta.estado;
    } catch {
      return null;
    }
  }

  private requireOperationId(operacion: PppoeOperacionEntity): number {
    if (operacion.id === null) {
      throw new ConflictException(
        'La operación PPPoE no contiene un identificador persistido.',
      );
    }

    return operacion.id;
  }

  private validateRetryInput(input: ReintentarOperacionPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertRequiredString(input.claveIdempotencia, 'claveIdempotencia');

    if (!input.actor) {
      throw new BadRequestException('actor es obligatorio.');
    }

    if (input.actor.iniciadoPorId !== null) {
      this.assertPositiveInteger(
        input.actor.iniciadoPorId,
        'actor.iniciadoPorId',
      );
    }

    if (
      input.actor.origen === OrigenOperacionPppoe.OPERADOR &&
      input.actor.iniciadoPorId === null
    ) {
      throw new BadRequestException(
        'actor.iniciadoPorId es obligatorio cuando el origen es OPERADOR.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
  }
}
