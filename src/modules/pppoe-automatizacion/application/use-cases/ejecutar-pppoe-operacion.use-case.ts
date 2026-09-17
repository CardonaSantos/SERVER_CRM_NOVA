import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
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
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';
import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';
import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';
import {
  CLIENTE_INTERNET_ESTADO_OPERATIVO,
  ClienteInternetEstadoOperativoPort,
  EstadoOperativoClienteInternet,
} from '../../domain/ports/cliente-internet-estado-operativo.port';

/**
 * Ejecuta una operación PPPoE previamente creada.
 *
 * Operaciones actualmente admitidas:
 *
 * - CREAR_SECRET;
 * - ACTIVAR_SECRET;
 * - SUSPENDER_SERVICIO.
 */
/**
 * Ejecuta una operación PPPoE previamente creada.
 *
 * Operaciones admitidas:
 *
 * - CREAR_SECRET;
 * - ACTIVAR_SECRET;
 * - SUSPENDER_SERVICIO;
 * - ELIMINAR_SECRET.
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
  private readonly logger = new Logger(EjecutarPppoeOperacionUseCase.name);

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

    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoRepository: ClienteAccesoInternetRepositoryPort,

    @Inject(CLIENTE_INTERNET_ESTADO_OPERATIVO)
    private readonly clienteEstadoOperativo: ClienteInternetEstadoOperativoPort,
  ) {}

  async execute(
    input: EjecutarPppoeOperacionUseCaseInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    let acceso: ClienteAccesoInternetEntity | null = null;

    this.logger.log(
      `[PPPOE] Ejecutando operación ${input.operacionId} empresa=${input.empresaId}`,
    );

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

      this.logger.log(
        [
          `[PPPOE] Contexto resuelto`,
          `operacionId=${input.operacionId}`,
          `tipo=${aggregate.operacion.tipo}`,
          `cuentaId=${contexto.cuenta.id ?? 'null'}`,
          `usuario=${contexto.cuenta.usuario}`,
          `estado=${contexto.cuenta.estado}`,
          `esAdoptada=${contexto.cuenta.esAdoptada}`,
        ].join(' | '),
      );

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

      acceso = await this.findRequiredAccess({
        empresaId: input.empresaId,

        cuenta: contexto.cuenta,
      });

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

      acceso = await this.prepareAccessForOperation({
        operacion: aggregate.operacion,

        acceso,
      });

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
      this.logger.log(
        `[PPPOE] Iniciando operación técnica RouterOS. operacionId=${input.operacionId} tipo=${aggregate.operacion.tipo}`,
      );

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
      const fechaSincronizacion = new Date();

      cuenta = await this.applySuccessfulAccountResult({
        operacion: aggregate.operacion,

        cuenta,

        fecha: fechaSincronizacion,
      });

      acceso = await this.applySuccessfulAccessResult({
        operacion: aggregate.operacion,

        acceso,

        fecha: fechaSincronizacion,
      });

      /*
       * Sincronizamos el estado operativo general
       * del cliente únicamente después de que:
       *
       * - RouterOS confirmó el resultado;
       * - ClientePppoeCuenta fue sincronizada;
       * - ClienteAccesoInternet fue sincronizado.
       */
      await this.applySuccessfulClientResult({
        operacion: aggregate.operacion,

        acceso,
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

      this.logger.error(
        [
          `[PPPOE] Operación técnica fallida`,
          `operacionId=${input.operacionId}`,
          `tipo=${aggregate.operacion.tipo}`,
          `codigo=${normalizedError.errorCodigo}`,
          `mensaje=${normalizedError.message}`,
          `executorStarted=${executorStarted}`,
          `remoteStateConfirmed=${remoteStateConfirmed}`,
        ].join(' | '),
      );

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

  private async applySuccessfulAccessResult(params: {
    operacion: PppoeOperacionEntity;

    acceso: ClienteAccesoInternetEntity;

    fecha: Date;
  }): Promise<ClienteAccesoInternetEntity> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        /*
         * Estado 2 — EN INSTALACIÓN.
         *
         * El Secret ya fue creado físicamente en RouterOS
         * y quedó habilitado según el requerimiento PPPoE v3.
         *
         * Sin embargo, el acceso continúa CONFIGURANDO porque
         * la instalación todavía no ha sido formalmente
         * confirmada como servicio ACTIVO dentro del CRM.
         *
         * La condición técnica del Secret en RouterOS y el
         * estado de negocio del acceso son conceptos distintos:
         *
         * RouterOS:
         *   Secret existente + habilitado.
         *
         * CRM:
         *   Acceso CONFIGURANDO.
         *
         * La transición a ACTIVO corresponde posteriormente
         * a ACTIVAR_SECRET / Estado 3.
         */
        return params.acceso;

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        /*
         * Estado 3 — ACTIVO.
         *
         * El comando enable ya fue ejecutado y confirmado
         * remotamente. Ahora sincronizamos el estado formal
         * del acceso en el CRM.
         */
        params.acceso.activar(params.fecha);

        break;

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        /*
         * Estado 4 — SUSPENDIDO.
         *
         * RouterOS ya confirmó:
         *
         * - Secret deshabilitado;
         * - ausencia de sesiones PPPoE activas.
         */
        params.acceso.suspender(params.fecha);

        break;

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        /*
         * Estado 5 — BAJA DEFINITIVA.
         *
         * RouterOS ya confirmó:
         *
         * - Secret eliminado;
         * - ausencia de sesiones PPPoE activas.
         */
        params.acceso.darDeBaja(params.fecha);

        break;

      default:
        throw new ConflictException(
          `No existe transición exitosa del acceso para la operación ${params.operacion.tipo}.`,
        );
    }

    return this.accesoRepository.update(params.acceso);
  }

  /**
   * Prepara la cuenta según el tipo de operación.
   */

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
        /*
         * ELIMINAR_SECRET puede provenir de:
         *
         * 1. una ClienteDesinstalacion;
         * 2. una baja administrativa manual.
         *
         * La autorización funcional y la reautenticación
         * pertenecen a los casos de uso superiores.
         *
         * Este motor solamente valida que la operación
         * persistida posea un contexto estructural coherente
         * antes de modificar el estado local o RouterOS.
         */
        this.assertValidDeletionContext(params.operacion);

        return this.prepareAccountForDeletion(params.cuenta);

      default:
        throw new ConflictException(
          `No existe preparación local para la operación ${params.operacion.tipo}.`,
        );
    }
  }

  private async prepareAccessForOperation(params: {
    operacion: PppoeOperacionEntity;

    acceso: ClienteAccesoInternetEntity;
  }): Promise<ClienteAccesoInternetEntity> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        params.acceso.iniciarConfiguracion();

        return this.accesoRepository.update(params.acceso);

      case TipoOperacionPppoe.ACTIVAR_SECRET:
      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return params.acceso;

      default:
        throw new ConflictException(
          `No existe preparación del acceso para la operación ${params.operacion.tipo}.`,
        );
    }
  }

  private async findRequiredAccess(params: {
    empresaId: number;

    cuenta: ClientePppoeCuentaEntity;
  }): Promise<ClienteAccesoInternetEntity> {
    const acceso = await this.accesoRepository.findById({
      empresaId: params.empresaId,

      accesoInternetId: params.cuenta.accesoInternetId,
    });

    if (!acceso) {
      throw new ConflictException(
        `No existe el acceso de internet ${params.cuenta.accesoInternetId} asociado a la cuenta PPPoE.`,
      );
    }

    return acceso;
  }

  /**
   * Sincroniza el estado operativo general de ClienteInternet
   * después de confirmar exitosamente el resultado PPPoE.
   *
   * Importante:
   *
   * - ACTIVAR_SECRET -> ACTIVO
   * - SUSPENDER_SERVICIO -> SUSPENDIDO
   *
   * No modifica estadoCobranza.
   *
   * CREAR_SECRET todavía no representa un servicio operativo.
   *
   * ELIMINAR_SECRET se conserva fuera de esta regla porque
   * una baja PPPoE no equivale necesariamente, por sí sola,
   * a completar una ClienteDesinstalacion.
   */
  private async applySuccessfulClientResult(params: {
    operacion: PppoeOperacionEntity;

    acceso: ClienteAccesoInternetEntity;
  }): Promise<void> {
    const operacion = params.operacion.toPrimitives();

    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.ACTIVAR_SECRET:
        await this.clienteEstadoOperativo.sincronizar({
          empresaId: params.acceso.empresaId,

          clienteId: params.acceso.clienteId,

          estado: EstadoOperativoClienteInternet.ACTIVO,

          cambiadoPorId: operacion.iniciadoPorId,

          motivo: operacion.motivo,

          descripcion:
            `Estado operativo sincronizado automáticamente ` +
            `después de confirmar la operación PPPoE ` +
            `${operacion.id ?? 'sin-id'} ACTIVAR_SECRET.`,
        });

        return;

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        await this.clienteEstadoOperativo.sincronizar({
          empresaId: params.acceso.empresaId,

          clienteId: params.acceso.clienteId,

          estado: EstadoOperativoClienteInternet.SUSPENDIDO,

          cambiadoPorId: operacion.iniciadoPorId,

          motivo: operacion.motivo,

          descripcion:
            `Estado operativo sincronizado automáticamente ` +
            `después de confirmar la operación PPPoE ` +
            `${operacion.id ?? 'sin-id'} SUSPENDER_SERVICIO.`,
        });

        return;

      case TipoOperacionPppoe.CREAR_SECRET:
      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return;

      default:
        return;
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
    /**
     * La existencia del secret debe estar confirmada.
     *
     * Cuenta creada por CRM:
     *   secretCreadoEn != null
     *
     * Cuenta adoptada:
     *   adoptadoEn != null
     *
     * Esta distinción ya está encapsulada en
     * cuenta.tieneSecretCreado.
     */
    if (!cuenta.tieneSecretCreado) {
      throw new ConflictException(
        'No puede suspenderse una cuenta cuyo secret no está confirmado como existente.',
      );
    }

    /**
     * Las cuentas generadas por CRM conocen su
     * fecha de activación.
     *
     * Las cuentas adoptadas pueden desconocer la fecha
     * histórica, pero fueron verificadas directamente
     * contra MikroTik antes de ser incorporadas.
     */
    const tieneActivacionConfirmada =
      cuenta.activadoEn !== null || cuenta.esAdoptada;

    if (!tieneActivacionConfirmada) {
      throw new ConflictException(
        'No puede suspenderse una cuenta que no tiene una activación confirmada.',
      );
    }

    switch (cuenta.estado) {
      case EstadoCuentaPppoe.ACTIVA:
        return cuenta;

      case EstadoCuentaPppoe.ERROR:
        /**
         * ERROR solamente se admite aquí para la ejecución
         * de un reintento de suspensión previamente fallido.
         *
         * La cadena de reintento se valida fuera de este método.
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
  /**
   * Prepara la cuenta para la activación formal del servicio.
   *
   * Estado 3 vuelve a ejecutar explícitamente:
   *
   * /ppp secret enable [find name="..."]
   *
   * aunque el Secret creado durante Estado 2 haya quedado
   * habilitado. Esto corresponde al comando definido por
   * la transición formal a ACTIVO en el requerimiento v3.
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
    fecha: Date;
  }): Promise<ClientePppoeCuentaEntity> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        params.cuenta.marcarSecretCreado(params.fecha);
        break;

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        params.cuenta.marcarActiva(params.fecha);
        break;

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        params.cuenta.marcarSuspendida(params.fecha);
        break;

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        params.cuenta.marcarEliminada(params.fecha);
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

  /**
   * Valida el contexto persistido de una operación
   * ELIMINAR_SECRET.
   *
   * Contextos válidos:
   *
   * DESINSTALACION
   *   desinstalacionId != null
   *
   * BAJA_MANUAL
   *   desinstalacionId == null
   *   instalacionId == null
   *
   * Una instalación por sí sola no constituye un
   * contexto válido para eliminar definitivamente
   * una cuenta PPPoE.
   *
   * La autorización del operador no se valida aquí.
   * Este caso de uso pertenece al motor técnico y
   * recibe operaciones previamente creadas por los
   * flujos de aplicación correspondientes.
   */
  private assertValidDeletionContext(operacion: PppoeOperacionEntity): void {
    if (operacion.tipo !== TipoOperacionPppoe.ELIMINAR_SECRET) {
      throw new ConflictException(
        `La operación PPPoE ${operacion.id ?? 'sin-id'} no corresponde a ELIMINAR_SECRET.`,
      );
    }

    /*
     * Flujo tradicional:
     *
     * ClienteDesinstalacion -> ELIMINAR_SECRET
     *
     * Puede conservar instalacionId o no.
     */
    if (operacion.desinstalacionId !== null) {
      return;
    }

    /*
     * Baja manual:
     *
     * No existe ClienteInstalacion ni
     * ClienteDesinstalacion como origen funcional.
     */
    if (operacion.instalacionId === null) {
      return;
    }

    /*
     * Contexto inconsistente:
     *
     * existe instalacionId pero no desinstalacionId.
     *
     * No admitimos que una instalación por sí sola
     * origine una eliminación definitiva.
     */
    throw new ConflictException(
      'La operación ELIMINAR_SECRET contiene un contexto inválido: una eliminación sin desinstalación no puede estar vinculada únicamente a una instalación.',
    );
  }
}
