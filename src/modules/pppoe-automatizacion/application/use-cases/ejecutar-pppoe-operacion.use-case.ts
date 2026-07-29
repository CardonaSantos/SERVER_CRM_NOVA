import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { FinalizarPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/finalizar-pppoe-operacion.use-case';

import { IniciarPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/iniciar-pppoe-operacion.use-case';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import { PppoeOperacionPasoEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion-paso.entity';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from 'src/modules/pppoe-operacion/domain/ports/pppoe-operacion-repository.port';

import {
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

import { PppoeOperacionStepError } from '../errors/pppoe-operacion-step.error';

import { CrearSecretPppoeExecutor } from '../executors/crear-secret-pppoe.executor';

import { ContextoEjecucionPppoe } from '../models/contexto-ejecucion-pppoe.model';

import { EjecutarOperacionPppoeResult } from '../../domain/props/pppoe-provisionamiento.props';

import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';
import { SuspenderServicioPppoeExecutor } from '../executors/suspender-servicio-pppoe.executor';
import { ResolverContextoEjecucionPppoeService } from '../services/resolver-contexto-ejecucion-pppoe.service';
import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/ppoe-cliente-cuenta.entity';
import { ActivarSecretPppoeExecutor } from '../executors/activar-secret-pppoe.executor';
import { PppoeOperacionResultado } from 'src/modules/pppoe-operacion/domain/props/pppoe-operacion.props';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../../domain/ports/pppoe-operacion-auditoria.port';
import { EliminarSecretPppoeExecutor } from '../executors/eliminar-secret-pppoe.executor';

/**
 * Ejecuta una operación PPPoE previamente creada.
 *
 * Operaciones actualmente admitidas:
 *
 * - CREAR_SECRET;
 * - ACTIVAR_SECRET;
 * - SUSPENDER_SERVICIO.
 */
export type EjecutarPppoeOperacionUseCaseInput = {
  empresaId: number;

  operacionId: number;

  /**
   * Útil para pruebas deterministas.
   *
   * En ejecución normal debe omitirse.
   */
  fechaInicio?: Date;
};

/**
 * Ejecuta una operación PPPoE previamente creada.
 *
 * Operaciones actualmente admitidas:
 *
 * - CREAR_SECRET;
 * - ACTIVAR_SECRET;
 * - SUSPENDER_SERVICIO;
 * - ELIMINAR_SECRET.
 */
@Injectable()
export class EjecutarPppoeOperacionUseCase {
  /**
   * Pasos que pueden modificar el estado remoto.
   *
   * Debe mantenerse alineado con
   * FinalizarPppoeOperacionUseCase.
   */
  private static readonly PASOS_CON_EFECTO_REMOTO = new Set<TipoPasoPppoe>([
    TipoPasoPppoe.AGREGAR_SECRET,

    TipoPasoPppoe.HABILITAR_SECRET,

    TipoPasoPppoe.DESHABILITAR_SECRET,

    TipoPasoPppoe.REMOVER_SESION_ACTIVA,

    TipoPasoPppoe.ELIMINAR_SECRET,
  ]);

  constructor(
    private readonly iniciarOperacion: IniciarPppoeOperacionUseCase,

    private readonly finalizarOperacion: FinalizarPppoeOperacionUseCase,

    private readonly resolverContexto: ResolverContextoEjecucionPppoeService,

    private readonly crearSecretExecutor: CrearSecretPppoeExecutor,

    private readonly stepRunner: PppoeOperacionStepRunnerService,

    private readonly activarSecretExecutor: ActivarSecretPppoeExecutor,

    private readonly suspenderServicioExecutor: SuspenderServicioPppoeExecutor,

    private readonly eliminarSecretExecutor: EliminarSecretPppoeExecutor,

    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly operacionRepository: PppoeOperacionRepositoryPort,
  ) {}

  async execute(
    input: EjecutarPppoeOperacionUseCaseInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    /*
     * La operación se persiste como EJECUTANDO antes
     * de comenzar cualquier acción técnica.
     */
    const aggregate = await this.iniciarOperacion.execute({
      empresaId: input.empresaId,

      operacionId: input.operacionId,

      fecha: input.fechaInicio,
    });

    this.assertSupportedOperation(aggregate.operacion);

    /*
     * Una operación EJECUTANDO que ya contiene pasos
     * procesados no se continúa ciegamente.
     *
     * Debe pasar posteriormente por el proceso explícito
     * de recuperación de operaciones interrumpidas.
     */
    this.assertNotInterrupted(aggregate);

    /*
     * La operación ya fue reclamada atómicamente
     * y se encuentra EJECUTANDO.
     */
    await this.operacionAuditoria.registrarIniciada({
      operacion: aggregate.operacion,

      fecha: input.fechaInicio,
    });

    let cuenta: ClientePppoeCuentaEntity | null = null;

    let contexto: ContextoEjecucionPppoe | null = null;

    let accountPrepared = false;

    let executorStarted = false;

    let remoteStateConfirmed = false;
    let estadoCuentaInicial: EstadoCuentaPppoe | null = null;

    try {
      /*
       * ======================================================
       * 1. RESOLVER CONTEXTO
       * ======================================================
       */

      contexto = await this.resolverContexto.resolve(aggregate.operacion);

      /*
       * Se conserva antes de cualquier transición local.
       *
       * Ejemplos:
       *
       * PENDIENTE_ACTIVACION -> EN_INSTALACION
       * EN_INSTALACION -> ACTIVA
       * ACTIVA -> SUSPENDIDA
       */
      estadoCuentaInicial = contexto.cuenta.estado;

      /*
       * ======================================================
       * 2. PREPARAR ESTADO LOCAL
       * ======================================================
       */

      cuenta = await this.prepareAccountForOperation({
        operacion: aggregate.operacion,

        cuenta: contexto.cuenta,
      });

      accountPrepared = true;

      contexto = {
        ...contexto,

        cuenta,
      };

      /*
       * ======================================================
       * 3. EJECUTAR ROUTEROS
       * ======================================================
       */

      executorStarted = true;

      const technicalResult = await this.executeTechnicalOperation({
        contexto,

        pasos: aggregate.pasos,
      });

      /*
       * El executor solo regresa después de que
       * CONFIRMAR_SECRET fue satisfactorio.
       */
      remoteStateConfirmed = true;

      /*
       * ======================================================
       * 4. SINCRONIZAR CUENTA LOCAL
       * ======================================================
       */
      cuenta = await this.applySuccessfulAccountResult({
        operacion: aggregate.operacion,

        cuenta,
      });

      /*
       * ======================================================
       * 5. FINALIZAR OPERACIÓN
       * ======================================================
       */

      const finalAggregate = await this.finalizarOperacion.execute({
        empresaId: input.empresaId,

        operacionId: input.operacionId,

        estadoFinal: EstadoOperacionPppoe.EXITOSA,

        resultado: technicalResult,
      });

      await this.operacionAuditoria.registrarFinalizada({
        operacion: finalAggregate.operacion,

        estadoCuentaAnterior: estadoCuentaInicial,

        estadoCuentaNuevo: cuenta.estado,
      });

      return this.toResult({
        operacion: finalAggregate.operacion,

        cuenta,

        technicalError: null,
      });
    } catch (error: unknown) {
      /*
       * RouterOS ya confirmó el estado remoto, pero falló
       * una escritura local o la finalización de la operación.
       *
       * No debe convertirse en FALLIDA ni repetirse el
       * comando remoto automáticamente.
       *
       * La operación permanece EJECUTANDO para que el futuro
       * recuperador reconcilie el estado local.
       */
      if (remoteStateConfirmed) {
        throw new ConflictException(
          `La operación PPPoE ${input.operacionId} confirmó el estado remoto, pero no pudo completar su sincronización local. Requiere recuperación.`,
        );
      }

      const normalizedError = this.normalizeExecutionError({
        error,

        executorStarted,
      });

      /*
       * Si el fallo ocurrió antes de que el executor
       * iniciara un paso, registramos el siguiente paso
       * pendiente como FALLIDO.
       *
       * Esto permite que la operación alcance un estado
       * terminal coherente.
       */
      const failedAggregate = await this.ensureFailedStep({
        empresaId: input.empresaId,

        operacionId: input.operacionId,

        error: normalizedError,
      });

      if (accountPrepared || executorStarted) {
        cuenta = await this.registerAccountErrorSafely({
          cuenta,

          cuentaPppoeId: failedAggregate.operacion.cuentaPppoeId,

          errorMessage: normalizedError.message,
        });
      } else {
        cuenta =
          cuenta ??
          (await this.findAccountSafely(
            failedAggregate.operacion.cuentaPppoeId,
          ));
      }

      const finalState = this.resolveFailedOperationState({
        error: normalizedError,

        pasos: failedAggregate.pasos,
      });

      const finalAggregate =
        finalState === EstadoOperacionPppoe.PARCIAL
          ? await this.finalizarOperacion.execute({
              empresaId: input.empresaId,

              operacionId: input.operacionId,

              estadoFinal: EstadoOperacionPppoe.PARCIAL,

              errorCodigo: normalizedError.errorCodigo,

              errorMensaje: normalizedError.message,

              resultado: null,
            })
          : await this.finalizarOperacion.execute({
              empresaId: input.empresaId,

              operacionId: input.operacionId,

              estadoFinal: EstadoOperacionPppoe.FALLIDA,

              errorCodigo: normalizedError.errorCodigo,

              errorMensaje: normalizedError.message,

              resultado: null,
            });

      /*
       * Reconsultamos para no devolver un estado de cuenta
       * únicamente modificado en memoria.
       */
      const persistedAccount = await this.findAccountSafely(
        finalAggregate.operacion.cuentaPppoeId,
      );

      const finalAccount = persistedAccount ?? cuenta;

      await this.operacionAuditoria.registrarFinalizada({
        operacion: finalAggregate.operacion,

        estadoCuentaAnterior: estadoCuentaInicial,

        estadoCuentaNuevo: finalAccount?.estado ?? null,
      });

      return this.toResult({
        operacion: finalAggregate.operacion,

        cuenta: finalAccount,

        technicalError: normalizedError,
      });
    }
  }

  /**
   * Prepara la cuenta según el tipo de operación.
   */

  private async prepareAccountForOperation(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaEntity;
  }): Promise<ClientePppoeCuentaEntity> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        return this.prepareAccountForSecretCreation(params.cuenta);

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        return this.prepareAccountForActivation(params.cuenta);

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return this.prepareAccountForSuspension(params.cuenta);

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        if (params.operacion.desinstalacionId === null) {
          throw new ConflictException(
            'ELIMINAR_SECRET debe estar vinculada a una desinstalación.',
          );
        }

        return this.prepareAccountForDeletion(params.cuenta);

      default:
        throw new ConflictException(
          `No existe preparación local para la operación ${params.operacion.tipo}.`,
        );
    }
  }

  /**
   * Prepara la cuenta para eliminar definitivamente
   * el secret del router.
   *
   * Flujo inicial:
   *
   * estado actual -> EN_DESINSTALACION
   *
   * Ejecución previamente preparada:
   *
   * EN_DESINSTALACION -> sin cambios
   *
   * Reintento:
   *
   * ERROR -> EN_DESINSTALACION
   */
  private async prepareAccountForDeletion(
    cuenta: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    switch (cuenta.estado) {
      case EstadoCuentaPppoe.PENDIENTE_ACTIVACION:
      case EstadoCuentaPppoe.EN_INSTALACION:
      case EstadoCuentaPppoe.EN_ACTIVACION:
      case EstadoCuentaPppoe.ACTIVA:
      case EstadoCuentaPppoe.SUSPENDIDA:
      case EstadoCuentaPppoe.ERROR:
        cuenta.iniciarDesinstalacion();

        return this.cuentaRepository.update(cuenta);

      case EstadoCuentaPppoe.EN_DESINSTALACION:
        /*
         * La cuenta ya fue preparada, pero todos los pasos
         * técnicos de la operación continúan PENDIENTES.
         */
        return cuenta;

      case EstadoCuentaPppoe.ELIMINADA:
        throw new ConflictException(
          'La cuenta PPPoE ya se encuentra eliminada.',
        );

      default:
        throw new ConflictException(
          `No puede ejecutarse ELIMINAR_SECRET con la cuenta en estado ${cuenta.estado}.`,
        );
    }
  }

  /**
   * Valida que la cuenta pueda entrar en una operación
   * de suspensión.
   *
   * No se cambia el estado antes de ejecutar SSH porque
   * actualmente el dominio no contiene EN_SUSPENSION.
   *
   * Flujo inicial:
   *
   * ACTIVA -> SUSPENDIDA
   *
   * Reintento:
   *
   * ERROR -> SUSPENDIDA
   */
  private async prepareAccountForSuspension(
    cuenta: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    if (!cuenta.tieneSecretCreado) {
      throw new ConflictException(
        'No puede suspenderse una cuenta cuyo secret todavía no ha sido creado.',
      );
    }

    if (!cuenta.activadoEn) {
      throw new ConflictException(
        'No puede suspenderse una cuenta que nunca fue activada.',
      );
    }

    switch (cuenta.estado) {
      case EstadoCuentaPppoe.ACTIVA:
        return cuenta;

      case EstadoCuentaPppoe.ERROR:
        /*
         * ERROR se admite para ejecutar un nuevo intento
         * de una suspensión previamente fallida.
         *
         * El caso de uso creador deberá comprobar que
         * realmente se trate de un reintento de suspensión.
         */
        return cuenta;

      default:
        throw new ConflictException(
          `No puede ejecutarse SUSPENDER_SERVICIO con la cuenta en estado ${cuenta.estado}.`,
        );
    }
  }

  /**
   * Prepara la cuenta para crear el secret.
   *
   * Flujo inicial:
   *
   * PENDIENTE_ACTIVACION -> EN_INSTALACION
   *
   * Reintento:
   *
   * ERROR -> EN_INSTALACION
   */
  private async prepareAccountForSecretCreation(
    cuenta: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    switch (cuenta.estado) {
      case EstadoCuentaPppoe.PENDIENTE_ACTIVACION:
        cuenta.iniciarInstalacion();

        return this.cuentaRepository.update(cuenta);

      case EstadoCuentaPppoe.ERROR:
        cuenta.reintentarInstalacion();

        return this.cuentaRepository.update(cuenta);

      case EstadoCuentaPppoe.EN_INSTALACION:
        /*
         * La cuenta pudo prepararse previamente,
         * mientras todos los pasos continúan PENDIENTES.
         */
        return cuenta;

      default:
        throw new ConflictException(
          `No puede ejecutarse CREAR_SECRET con la cuenta en estado ${cuenta.estado}.`,
        );
    }
  }

  /**
   * Prepara la cuenta para habilitar el secret.
   *
   * Primera activación:
   *
   * EN_INSTALACION -> EN_ACTIVACION
   *
   * Reactivación:
   *
   * SUSPENDIDA -> EN_ACTIVACION
   *
   * Reintento:
   *
   * ERROR -> EN_ACTIVACION
   */
  private async prepareAccountForActivation(
    cuenta: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    switch (cuenta.estado) {
      case EstadoCuentaPppoe.EN_INSTALACION:
      case EstadoCuentaPppoe.SUSPENDIDA:
        cuenta.iniciarActivacion();

        return this.cuentaRepository.update(cuenta);

      case EstadoCuentaPppoe.ERROR:
        cuenta.reintentarActivacion();

        return this.cuentaRepository.update(cuenta);

      case EstadoCuentaPppoe.EN_ACTIVACION:
        /*
         * La cuenta ya fue preparada, pero todavía
         * no comenzó ningún paso técnico.
         */
        return cuenta;

      default:
        throw new ConflictException(
          `No puede ejecutarse ACTIVAR_SECRET con la cuenta en estado ${cuenta.estado}.`,
        );
    }
  }

  /**
   * Selecciona el ejecutor técnico correspondiente.
   */
  private async executeTechnicalOperation(params: {
    contexto: ContextoEjecucionPppoe;

    pasos: PppoeOperacionPasoEntity[];
  }): Promise<PppoeOperacionResultado> {
    switch (params.contexto.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        return this.crearSecretExecutor.execute({
          contexto: params.contexto,

          pasos: params.pasos,
        });

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        return this.activarSecretExecutor.execute({
          contexto: params.contexto,

          pasos: params.pasos,
        });

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return this.suspenderServicioExecutor.execute({
          contexto: params.contexto,

          pasos: params.pasos,
        });

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return this.eliminarSecretExecutor.execute({
          contexto: params.contexto,

          pasos: params.pasos,
        });

      default:
        throw new ConflictException(
          `No existe ejecutor técnico para la operación ${params.contexto.operacion.tipo}.`,
        );
    }
  }

  /**
   * Aplica a la cuenta el resultado remoto ya confirmado.
   */
  private async applySuccessfulAccountResult(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaEntity;
  }): Promise<ClientePppoeCuentaEntity> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        params.cuenta.marcarSecretCreado();

        break;

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        params.cuenta.marcarActiva();

        break;

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        params.cuenta.marcarSuspendida();

        break;

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        params.cuenta.marcarEliminada();

        break;

      default:
        throw new ConflictException(
          `No existe transición local exitosa para la operación ${params.operacion.tipo}.`,
        );
    }

    return this.cuentaRepository.update(params.cuenta);
  }

  /**
   * Convierte un error en una clasificación técnica segura.
   */
  private normalizeExecutionError(params: {
    error: unknown;

    executorStarted: boolean;
  }): PppoeOperacionStepError {
    if (params.error instanceof PppoeOperacionStepError) {
      return params.error;
    }

    /*
     * Una vez entregado el control al executor,
     * cualquier error no clasificado se considera
     * conservadoramente como posible efecto remoto.
     */
    if (params.executorStarted) {
      return PppoeOperacionStepError.from(params.error);
    }

    /*
     * Resolución de contexto y preparación de cuenta ocurren
     * antes de abrir la sesión y no modifican RouterOS.
     */
    return new PppoeOperacionStepError({
      errorCodigo: 'PPPOE_CONTEXTO_EJECUCION_INVALIDO',

      errorMensaje:
        'No pudo prepararse el contexto necesario para ejecutar la operación PPPoE.',

      efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

      reintentable: true,

      fase: FaseFalloMikrotikSsh.CONFIGURACION,

      cause: params.error,
    });
  }

  /**
   * Garantiza que exista un paso FALLIDO antes de finalizar
   * la operación como FALLIDA o PARCIAL.
   */
  private async ensureFailedStep(params: {
    empresaId: number;

    operacionId: number;

    error: PppoeOperacionStepError;
  }): Promise<PppoeOperacionAggregate> {
    let aggregate = await this.loadAggregate({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    const executingStep = aggregate.pasos.find((paso) => paso.estaEjecutando());

    if (executingStep) {
      throw new ConflictException(
        `La operación PPPoE ${params.operacionId} conserva el paso ${executingStep.orden} en estado EJECUTANDO y requiere recuperación.`,
      );
    }

    const failedStep = aggregate.pasos.find((paso) => paso.fueFallido());

    if (failedStep) {
      return aggregate;
    }

    const pendingStep = [...aggregate.pasos]
      .sort((left, right) => left.orden - right.orden)
      .find((paso) => paso.estaPendiente());

    if (!pendingStep) {
      throw new ConflictException(
        `La operación PPPoE ${params.operacionId} no contiene un paso disponible para registrar el fallo y requiere recuperación.`,
      );
    }

    try {
      await this.stepRunner.ejecutar({
        empresaId: params.empresaId,

        operacionId: params.operacionId,

        orden: pendingStep.orden,

        comandoSanitizado: 'INTERRUMPIR_PASO_POR_ERROR_PREVIO',

        ejecutar: async () => {
          throw params.error;
        },
      });
    } catch {
      /*
       * El runner siempre propaga el error técnico después
       * de persistir el paso FALLIDO.
       */
    }

    aggregate = await this.loadAggregate({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    const persistedExecutingStep = aggregate.pasos.find((paso) =>
      paso.estaEjecutando(),
    );

    if (persistedExecutingStep) {
      throw new ConflictException(
        `El paso ${persistedExecutingStep.orden} no pudo finalizarse y la operación PPPoE ${params.operacionId} requiere recuperación.`,
      );
    }

    const persistedFailedStep = aggregate.pasos.find((paso) =>
      paso.fueFallido(),
    );

    if (!persistedFailedStep) {
      throw new ConflictException(
        `No pudo registrarse el fallo técnico de la operación PPPoE ${params.operacionId}.`,
      );
    }

    return aggregate;
  }

  /**
   * Determina si existe evidencia suficiente para PARCIAL.
   *
   * La clasificación debe coincidir con las reglas
   * de FinalizarPppoeOperacionUseCase.
   */
  private resolveFailedOperationState(params: {
    error: PppoeOperacionStepError;

    pasos: PppoeOperacionPasoEntity[];
  }): EstadoOperacionPppoe.PARCIAL | EstadoOperacionPppoe.FALLIDA {
    if (!params.error.debeFinalizarComoParcial()) {
      return EstadoOperacionPppoe.FALLIDA;
    }

    const hasRemoteEffectEvidence = params.pasos.some(
      (paso) =>
        EjecutarPppoeOperacionUseCase.PASOS_CON_EFECTO_REMOTO.has(paso.tipo) &&
        (paso.fueExitoso() || paso.fueFallido()),
    );

    return hasRemoteEffectEvidence
      ? EstadoOperacionPppoe.PARCIAL
      : EstadoOperacionPppoe.FALLIDA;
  }

  /**
   * Registra el error en la cuenta sin sustituir
   * el error técnico principal.
   */
  private async registerAccountErrorSafely(params: {
    cuenta: ClientePppoeCuentaEntity | null;

    cuentaPppoeId: number;

    errorMessage: string;
  }): Promise<ClientePppoeCuentaEntity | null> {
    try {
      const cuenta =
        params.cuenta ??
        (await this.cuentaRepository.findById(params.cuentaPppoeId));

      if (!cuenta || cuenta.estaEliminada) {
        return cuenta;
      }

      cuenta.registrarError(params.errorMessage);

      return await this.cuentaRepository.update(cuenta);
    } catch {
      /*
       * La operación conserva el error principal.
       *
       * La reconciliación de la cuenta será responsabilidad
       * del recuperador si esta escritura local falla.
       */
      return params.cuenta;
    }
  }

  private async findAccountSafely(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaEntity | null> {
    try {
      return await this.cuentaRepository.findById(cuentaPppoeId);
    } catch {
      return null;
    }
  }

  private async loadAggregate(params: {
    empresaId: number;

    operacionId: number;
  }): Promise<PppoeOperacionAggregate> {
    const aggregate = await this.operacionRepository.findAggregateById({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    if (!aggregate) {
      throw new ConflictException(
        `No pudo recargarse la operación PPPoE ${params.operacionId}.`,
      );
    }

    return aggregate;
  }

  private assertSupportedOperation(operacion: PppoeOperacionEntity): void {
    switch (operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
      case TipoOperacionPppoe.ACTIVAR_SECRET:
      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return;

      default:
        throw new ConflictException(
          `EjecutarPppoeOperacionUseCase todavía no admite operaciones de tipo ${operacion.tipo}.`,
        );
    }
  }

  /**
   * Evita reanudar ciegamente una ejecución previa.
   */
  private assertNotInterrupted(aggregate: PppoeOperacionAggregate): void {
    const processedStep = aggregate.pasos.find((paso) => !paso.estaPendiente());

    if (!processedStep) {
      return;
    }

    throw new ConflictException(
      `La operación PPPoE ${aggregate.operacion.id} ya contiene el paso ${processedStep.orden} en estado ${processedStep.estado}. Debe pasar por recuperación antes de continuar.`,
    );
  }

  private toResult(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaEntity | null;

    technicalError: PppoeOperacionStepError | null;
  }): EjecutarOperacionPppoeResult {
    const operationProps = params.operacion.toPrimitives();

    return {
      operacionId: this.requirePersistedId(params.operacion),

      cuentaPppoeId: params.operacion.cuentaPppoeId,

      tipo: params.operacion.tipo,

      estadoOperacion: params.operacion.estado,

      estadoCuenta: params.cuenta?.estado ?? null,

      numeroIntento: params.operacion.numeroIntento,

      reintentable:
        params.operacion.puedeReintentarse() &&
        (params.technicalError?.reintentable ?? true),

      resultado: operationProps.resultado,

      errorCodigo: operationProps.errorCodigo,

      errorMensaje: operationProps.errorMensaje,
    };
  }

  private requirePersistedId(operacion: PppoeOperacionEntity): number {
    if (operacion.id === null) {
      throw new Error('La operación PPPoE no contiene identificador.');
    }

    return operacion.id;
  }

  private validateInput(input: EjecutarPppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    if (
      input.fechaInicio !== undefined &&
      (!(input.fechaInicio instanceof Date) ||
        Number.isNaN(input.fechaInicio.getTime()))
    ) {
      throw new BadRequestException(
        'fechaInicio debe contener una fecha válida.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
