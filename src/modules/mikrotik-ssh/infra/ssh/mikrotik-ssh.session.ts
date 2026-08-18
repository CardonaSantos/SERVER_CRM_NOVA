import { Client } from 'ssh2';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  EstadoSesionMikrotikSsh,
  FaseFalloMikrotikSsh,
} from '../../domain/enums/mikrotik-ssh.enums';

import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

import { MikrotikSshSessionPort } from '../../domain/ports/mikrotik-ssh-session.port';

import { ConfiguracionMikrotikSsh } from '../../domain/props/mikrotik-ssh-config.props';

import {
  BuscarSecretMikrotikParams,
  ConfirmarSecretMikrotikParams,
  CrearSecretMikrotikParams,
  GestionarSecretMikrotikParams,
  RemoverSesionActivaMikrotikParams,
} from '../../domain/props/mikrotik-ssh-secret.props';

import { SesionMikrotikSshInfo } from '../../domain/props/mikrotik-ssh-session.props';

import {
  AccionGestionSecretMikrotik,
  BuscarSecretMikrotikResult,
  ConfirmarSecretMikrotikResult,
  CrearSecretMikrotikResult,
  GestionarSecretMikrotikResult,
  RemoverSesionActivaMikrotikResult,
} from '../../domain/results/mikrotik-ssh-secret.result';

import { MikrotikPppoeCommandBuilder } from '../routeros/mikrotik-pppoe-command.builder';

import { MikrotikPppoeResponseParser } from '../routeros/mikrotik-pppoe-response.parser';

import { ComandoRouterOsConstruido } from '../routeros/types/routeros-command.types';
import { BuscarSesionesActivasRouterOsResult } from '../routeros/types/routeros-response-parser.types';
import { MikrotikSshCommandExecutor } from './mikrotik-ssh-command.executor';

import {
  FaseComandoMikrotikSsh,
  ResultadoEjecucionComandoMikrotikSsh,
} from './types/mikrotik-ssh-command.types';

type ConfirmacionRemocionSesionesActivasResult = {
  estadoFinal: BuscarSesionesActivasRouterOsResult;

  intentos: number;

  duracionMs: number;
};

type ConfiguracionConfirmacionSesionActiva = {
  maxAttempts: number;

  initialDelayMs: number;

  maxDelayMs: number;
};

/**
 * Sesión SSH individual contra un router MikroTik.
 *
 * Cada instancia administra un único Client conectado.
 *
 * Las operaciones se serializan para evitar ejecutar
 * comandos simultáneamente sobre la misma conexión SSH.
 */
export class MikrotikSshSession implements MikrotikSshSessionPort {
  private estado: EstadoSesionMikrotikSsh = EstadoSesionMikrotikSsh.ABIERTA;

  private readonly info: SesionMikrotikSshInfo;

  /**
   * Cola interna utilizada para ejecutar los comandos
   * de forma estrictamente secuencial.
   */
  private commandQueue: Promise<void> = Promise.resolve();

  private closePromise: Promise<void> | null = null;

  private lastClientError: Error | null = null;

  constructor(
    private readonly client: Client,

    info: SesionMikrotikSshInfo,

    private readonly config: ConfiguracionMikrotikSsh,

    private readonly commandBuilder: MikrotikPppoeCommandBuilder,

    private readonly commandExecutor: MikrotikSshCommandExecutor,

    private readonly responseParser: MikrotikPppoeResponseParser,
  ) {
    this.info = {
      ...info,

      conectadoEn: new Date(info.conectadoEn.getTime()),
    };

    this.attachClientListeners();
  }

  obtenerInfo(): SesionMikrotikSshInfo {
    return {
      ...this.info,

      conectadoEn: new Date(this.info.conectadoEn.getTime()),
    };
  }

  estaAbierta(): boolean {
    return this.estado === EstadoSesionMikrotikSsh.ABIERTA;
  }

  /**
   * Consulta un secret PPPoE.
   *
   * Es una operación de lectura y no produce
   * efectos remotos sobre RouterOS.
   */
  buscarSecret(
    params: BuscarSecretMikrotikParams,
  ): Promise<BuscarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.buscarSecretInternal(
        params,

        FaseFalloMikrotikSsh.EJECUCION,

        EfectoRemotoMikrotik.NO_INICIADO,
      ),
    );
  }

  /**
   * Envía el comando RouterOS encargado de crear
   * un nuevo secret PPPoE.
   *
   * Que el comando sea aceptado no significa todavía
   * que el estado remoto haya sido confirmado.
   */
  crearSecret(
    params: CrearSecretMikrotikParams,
  ): Promise<CrearSecretMikrotikResult> {
    return this.enqueueCommand(async () => {
      this.assertOpen();

      const command = this.commandBuilder.construirCrearSecret(params);

      const execution = await this.executeCommand(
        command,

        FaseFalloMikrotikSsh.EJECUCION,

        EfectoRemotoMikrotik.POSIBLE,
      );

      return this.responseParser.parseCrearSecret(execution, params);
    });
  }

  /**
   * Ejecuta:
   *
   * /ppp secret enable [find name="..."]
   */
  habilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.gestionarSecretInternal(params, 'HABILITAR'),
    );
  }

  /**
   * Ejecuta:
   *
   * /ppp secret disable [find name="..."]
   */
  deshabilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.gestionarSecretInternal(params, 'DESHABILITAR'),
    );
  }

  /**
   * Ejecuta:
   *
   * /ppp secret remove [find name="..."]
   */
  eliminarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.gestionarSecretInternal(params, 'ELIMINAR'),
    );
  }

  /**
   * Confirma el estado final de un secret.
   *
   * La confirmación se realiza mediante una nueva
   * consulta al router después de la mutación.
   */
  confirmarSecret(
    params: ConfirmarSecretMikrotikParams,
  ): Promise<ConfirmarSecretMikrotikResult> {
    return this.enqueueCommand(async () => {
      this.assertOpen();

      /**
       * Si esta consulta falla después de una mutación,
       * debemos considerar que el efecto remoto pudo
       * haberse producido.
       */
      const search = await this.buscarSecretInternal(
        {
          usuarioPppoe: params.usuarioPppoe,
        },

        FaseFalloMikrotikSsh.CONFIRMACION,

        EfectoRemotoMikrotik.POSIBLE,
      );

      return this.responseParser.confirmarSecret(search, params);
    });
  }

  /**
   * Remueve todas las sesiones PPPoE activas
   * correspondientes al usuario.
   *
   * Flujo:
   *
   * 1. consultar sesiones antes;
   * 2. ejecutar exactamente:
   *
   *    /ppp active remove [find name="..."]
   *
   * 3. consultar sesiones después;
   * 4. confirmar que no permanece ninguna.
   *
   * La consulta previa NO condiciona la ejecución
   * del comando remove.
   */
  removerSesionActiva(
    params: RemoverSesionActivaMikrotikParams,
  ): Promise<RemoverSesionActivaMikrotikResult> {
    return this.enqueueCommand(() => this.removerSesionActivaInternal(params));
  }

  /**
   * El cierre se agrega al final de la cola.
   *
   * Así no interrumpe un comando que todavía
   * se encuentre en ejecución.
   */
  cerrar(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }

    this.closePromise = this.enqueueCommand(() => this.closeInternal());

    return this.closePromise;
  }

  /**
   * Consulta interna reutilizable para buscar
   * el secret PPPoE.
   *
   * Permite distinguir entre una consulta normal
   * y una consulta utilizada como confirmación.
   */
  private async buscarSecretInternal(
    params: BuscarSecretMikrotikParams,
    fase: FaseComandoMikrotikSsh,
    efectoRemoto: EfectoRemotoMikrotik,
  ): Promise<BuscarSecretMikrotikResult> {
    this.assertOpen();

    const command = this.commandBuilder.construirBuscarSecret(params);

    const execution = await this.executeCommand(command, fase, efectoRemoto);

    return this.parseWithContext(
      () => this.responseParser.parseBuscarSecret(execution, params),

      fase,

      efectoRemoto,
    );
  }

  /**
   * Ejecuta enable, disable o remove sobre un secret.
   *
   * El parser únicamente confirma que RouterOS aceptó
   * el comando.
   *
   * La comprobación definitiva pertenece al
   * paso CONFIRMAR_SECRET de la operación PPPoE.
   */
  private async gestionarSecretInternal(
    params: GestionarSecretMikrotikParams,
    accion: AccionGestionSecretMikrotik,
  ): Promise<GestionarSecretMikrotikResult> {
    this.assertOpen();

    const command = this.buildSecretManagementCommand(params, accion);

    const execution = await this.executeCommand(
      command,

      FaseFalloMikrotikSsh.EJECUCION,

      EfectoRemotoMikrotik.POSIBLE,
    );

    return this.responseParser.parseGestionSecret(execution, params, accion);
  }

  /**
   * Ejecuta y confirma la remoción de sesiones PPPoE.
   *
   * IMPORTANTE:
   *
   * El comando modificador:
   *
   * /ppp active remove [find name="..."]
   *
   * se ejecuta exactamente una vez.
   *
   * RouterOS puede aceptar el comando antes de que la sesión
   * PPPoE haya desaparecido completamente de /ppp active.
   *
   * Por ese motivo la confirmación posterior utiliza polling
   * acotado con backoff.
   *
   * Los reintentos pertenecen exclusivamente a consultas de
   * lectura. Nunca se repite el comando remove dentro de esta
   * operación.
   */
  private async removerSesionActivaInternal(
    params: RemoverSesionActivaMikrotikParams,
  ): Promise<RemoverSesionActivaMikrotikResult> {
    this.assertOpen();

    /**
     * ========================================================
     * 1. ESTADO ANTERIOR
     * ========================================================
     *
     * Capturamos las sesiones existentes antes de la mutación.
     *
     * Esta consulta sirve para:
     *
     * - auditoría;
     * - diagnóstico;
     * - calcular cuántas sesiones desaparecieron.
     */
    const before = await this.buscarSesionesActivasInternal(
      params,

      FaseFalloMikrotikSsh.EJECUCION,

      EfectoRemotoMikrotik.NO_INICIADO,
    );

    const sesionesEncontradas = before.sesiones.length;

    /**
     * ========================================================
     * 2. REMOVER SESIONES
     * ========================================================
     *
     * Este comando se ejecuta UNA SOLA VEZ:
     *
     * /ppp active remove [find name="..."]
     *
     * El hecho de que RouterOS acepte el comando no implica
     * necesariamente que /ppp active haya convergido todavía
     * al estado final esperado.
     */
    const removeCommand =
      this.commandBuilder.construirRemoverSesionesActivas(params);

    const removeExecution = await this.executeCommand(
      removeCommand,

      FaseFalloMikrotikSsh.EJECUCION,

      EfectoRemotoMikrotik.POSIBLE,
    );

    const removal = this.responseParser.parseRemoverSesionesActivas(
      removeExecution,
      params,
    );

    /**
     * ========================================================
     * 3. CONFIRMAR CONVERGENCIA DEL ESTADO REMOTO
     * ========================================================
     *
     * A partir de este punto NO volvemos a ejecutar remove.
     *
     * Únicamente consultamos /ppp active hasta que:
     *
     * - no existan sesiones para el usuario; o
     * - agotemos el número máximo de comprobaciones.
     */
    const confirmation = await this.confirmarRemocionSesionesActivas(params);

    const after = confirmation.estadoFinal;

    const sesionesRestantes = after.sesiones.length;

    const sesionesRemovidas = Math.max(
      0,
      sesionesEncontradas - sesionesRestantes,
    );

    /**
     * La duración total de la operación compuesta incluye:
     *
     * - consulta previa;
     * - comando remove;
     * - consultas posteriores;
     * - esperas de backoff.
     */
    const totalDuration =
      before.duracionMs + removeExecution.duracionMs + confirmation.duracionMs;

    /**
     * ========================================================
     * 4. VALIDAR ESTADO FINAL
     * ========================================================
     *
     * Solo declaramos SESION_NO_CONFIRMADA después de haber
     * agotado toda la ventana de confirmación.
     */
    if (sesionesRestantes > 0) {
      throw new MikrotikSshError(
        `Permanecen ${sesionesRestantes} sesiones PPPoE activas después de ` +
          `${confirmation.intentos} comprobaciones de confirmación ` +
          `durante ${confirmation.duracionMs} ms.`,
        {
          codigo: CodigoErrorMikrotikSsh.SESION_NO_CONFIRMADA,

          fase: FaseFalloMikrotikSsh.CONFIRMACION,

          efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

          reintentable: true,

          duracionMs: totalDuration,
        },
      );
    }

    /**
     * ========================================================
     * 5. RESULTADO CONFIRMADO
     * ========================================================
     */
    return {
      usuarioPppoe: params.usuarioPppoe,

      sesionesEncontradas,

      sesionesRemovidas,

      sesionesRestantes: 0,

      /**
       * Conservamos el snapshot anterior a la mutación.
       */
      sesiones: before.sesiones,

      confirmacionIntentos: confirmation.intentos,

      confirmacionDuracionMs: confirmation.duracionMs,

      duracionMs: totalDuration,

      /**
       * No repetimos cada comando de consulta utilizado durante
       * polling para evitar inflar innecesariamente la trazabilidad.
       *
       * Conservamos:
       *
       * - consulta inicial;
       * - mutación;
       * - consulta final confirmada.
       */
      comandoSanitizado: this.joinSanitizedCommands([
        before.comandoSanitizado,

        removal.comandoSanitizado,

        after.comandoSanitizado,
      ]),

      respuestaSanitizada:
        sesionesEncontradas === 0
          ? `No existían sesiones PPPoE activas. Se confirmó ausencia de sesiones ` +
            `en ${confirmation.intentos} comprobación(es) y ` +
            `${confirmation.duracionMs} ms.`
          : `Se removieron y confirmaron ${sesionesRemovidas} sesiones PPPoE activas. ` +
            `La convergencia se confirmó en ${confirmation.intentos} comprobación(es) ` +
            `y ${confirmation.duracionMs} ms.`,
    };
  }

  // nuevos helpers por tiempo
  /**
   * Confirma eventualmente que RouterOS dejó de reportar
   * sesiones PPPoE activas para el usuario.
   *
   * La primera consulta se realiza inmediatamente.
   *
   * Si todavía existen sesiones, las siguientes consultas
   * utilizan backoff exponencial acotado:
   *
   * 100 ms
   * 200 ms
   * 400 ms
   * 800 ms
   * 800 ms
   * ...
   *
   * según la configuración activa.
   *
   * Este método es exclusivamente de lectura.
   * Nunca vuelve a ejecutar /ppp active remove.
   */
  private async confirmarRemocionSesionesActivas(
    params: RemoverSesionActivaMikrotikParams,
  ): Promise<ConfirmacionRemocionSesionesActivasResult> {
    const config = this.resolveActiveSessionConfirmationConfig();

    const startedAt = Date.now();

    let estadoFinal: BuscarSesionesActivasRouterOsResult | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
      /**
       * La primera comprobación es inmediata.
       *
       * Antes de cada intento posterior esperamos utilizando
       * backoff exponencial acotado.
       */
      if (attempt > 1) {
        const delayMs = this.calculateConfirmationDelay({
          attempt,
          initialDelayMs: config.initialDelayMs,
          maxDelayMs: config.maxDelayMs,
        });

        await this.delay(delayMs);
      }

      /**
       * Antes de cada nueva consulta comprobamos que la sesión
       * SSH siga disponible.
       */
      this.assertOpen();

      estadoFinal = await this.buscarSesionesActivasInternal(
        params,

        FaseFalloMikrotikSsh.CONFIRMACION,

        EfectoRemotoMikrotik.POSIBLE,
      );

      /**
       * RouterOS ya convergió al estado esperado.
       *
       * Terminamos inmediatamente y no consumimos los intentos
       * restantes.
       */
      if (estadoFinal.sesiones.length === 0) {
        return {
          estadoFinal,

          intentos: attempt,

          duracionMs: Math.max(0, Date.now() - startedAt),
        };
      }
    }

    /**
     * maxAttempts siempre debe ser >= 1, por lo que llegar aquí
     * sin haber realizado ninguna consulta indicaría una
     * configuración o flujo interno inválido.
     */
    if (!estadoFinal) {
      throw new MikrotikSshError(
        'No pudo iniciarse la confirmación de sesiones PPPoE activas.',
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

          reintentable: false,

          duracionMs: Math.max(0, Date.now() - startedAt),
        },
      );
    }

    /**
     * Devolvemos el último estado observado.
     *
     * removerSesionActivaInternal() es quien transforma este
     * resultado agotado en SESION_NO_CONFIRMADA.
     */
    return {
      estadoFinal,

      intentos: config.maxAttempts,

      duracionMs: Math.max(0, Date.now() - startedAt),
    };
  }

  /**
   * Resuelve la configuración del polling.
   *
   * Los defaults internos preservan compatibilidad con tests,
   * fixtures o consumidores que construyan manualmente
   * ConfiguracionMikrotikSsh sin los nuevos campos.
   *
   * El provider oficial debe entregar estos valores
   * explícitamente en ejecución normal.
   */
  private resolveActiveSessionConfirmationConfig(): ConfiguracionConfirmacionSesionActiva {
    const maxAttempts = this.config.activeSessionConfirmationMaxAttempts ?? 6;

    const initialDelayMs =
      this.config.activeSessionConfirmationInitialDelayMs ?? 100;

    const maxDelayMs = this.config.activeSessionConfirmationMaxDelayMs ?? 800;

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new MikrotikSshError(
        'La cantidad máxima de intentos para confirmar sesiones PPPoE no es válida.',
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,
        },
      );
    }

    if (!Number.isInteger(initialDelayMs) || initialDelayMs < 0) {
      throw new MikrotikSshError(
        'La espera inicial para confirmar sesiones PPPoE no es válida.',
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,
        },
      );
    }

    if (!Number.isInteger(maxDelayMs) || maxDelayMs < 0) {
      throw new MikrotikSshError(
        'La espera máxima para confirmar sesiones PPPoE no es válida.',
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,
        },
      );
    }

    if (maxDelayMs < initialDelayMs) {
      throw new MikrotikSshError(
        'La espera máxima para confirmar sesiones PPPoE no puede ser menor que la espera inicial.',
        {
          codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIGURACION,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,
        },
      );
    }

    return {
      maxAttempts,

      initialDelayMs,

      maxDelayMs,
    };
  }

  /**
   * Espera no bloqueante utilizada exclusivamente entre
   * consultas de confirmación.
   *
   * No bloquea el event loop de Node.js.
   */
  private delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Calcula el backoff utilizado antes de una comprobación
   * posterior a la primera.
   *
   * attempt:
   *
   * 2 -> initialDelay
   * 3 -> initialDelay * 2
   * 4 -> initialDelay * 4
   *
   * El crecimiento queda limitado por maxDelayMs.
   */
  private calculateConfirmationDelay(params: {
    attempt: number;

    initialDelayMs: number;

    maxDelayMs: number;
  }): number {
    if (params.initialDelayMs === 0) {
      return 0;
    }

    const exponent = Math.max(0, params.attempt - 2);

    const calculatedDelay = params.initialDelayMs * 2 ** exponent;

    return Math.min(calculatedDelay, params.maxDelayMs);
  }

  /**
   * Consulta las sesiones PPPoE activas del usuario.
   *
   * Puede utilizarse tanto durante EJECUCION como
   * durante CONFIRMACION.
   */
  private async buscarSesionesActivasInternal(
    params: RemoverSesionActivaMikrotikParams,
    fase: FaseComandoMikrotikSsh,
    efectoRemoto: EfectoRemotoMikrotik,
  ) {
    this.assertOpen();

    const command = this.commandBuilder.construirBuscarSesionesActivas(params);

    const execution = await this.executeCommand(command, fase, efectoRemoto);

    return this.parseWithContext(
      () => this.responseParser.parseBuscarSesionesActivas(execution, params),

      fase,

      efectoRemoto,
    );
  }

  /**
   * Selecciona el comando RouterOS correspondiente
   * a la acción semántica solicitada.
   */
  private buildSecretManagementCommand(
    params: GestionarSecretMikrotikParams,
    accion: AccionGestionSecretMikrotik,
  ): ComandoRouterOsConstruido {
    switch (accion) {
      case 'HABILITAR':
        return this.commandBuilder.construirHabilitarSecret(params);

      case 'DESHABILITAR':
        return this.commandBuilder.construirDeshabilitarSecret(params);

      case 'ELIMINAR':
        return this.commandBuilder.construirEliminarSecret(params);
    }
  }

  /**
   * Punto único por el que los comandos construidos
   * son entregados al executor SSH.
   */
  private executeCommand(
    command: ComandoRouterOsConstruido,
    fase: FaseComandoMikrotikSsh,
    efectoRemoto: EfectoRemotoMikrotik,
  ): Promise<ResultadoEjecucionComandoMikrotikSsh> {
    return this.commandExecutor.execute(this.client, this.config, {
      comando: command.comando,

      comandoSanitizado: command.comandoSanitizado,

      fase,

      efectoRemotoEnFallo: efectoRemoto,
    });
  }

  /**
   * Los parsers de las consultas producen originalmente
   * errores en contexto EJECUCION.
   *
   * Cuando la misma consulta se utiliza como confirmación,
   * normalizamos el contexto técnico para conservar
   * correctamente:
   *
   * - fase;
   * - posible efecto remoto.
   */
  private parseWithContext<T>(
    callback: () => T,
    fase: FaseComandoMikrotikSsh,
    efectoRemoto: EfectoRemotoMikrotik,
  ): T {
    try {
      return callback();
    } catch (error) {
      if (!MikrotikSshError.is(error)) {
        throw error;
      }

      if (error.fase === fase && error.efectoRemoto === efectoRemoto) {
        throw error;
      }

      throw new MikrotikSshError(error.message, {
        codigo: error.codigo,

        fase,

        efectoRemoto,

        reintentable: error.reintentable,

        duracionMs: error.duracionMs,

        cause: error,
      });
    }
  }

  /**
   * Ejecuta cada tarea después de la anterior,
   * incluso cuando la anterior finalizó con error.
   */
  private enqueueCommand<T>(callback: () => Promise<T>): Promise<T> {
    const execution = this.commandQueue.then(callback, callback);

    this.commandQueue = execution.then(
      () => undefined,
      () => undefined,
    );

    return execution;
  }

  /**
   * Garantiza que la sesión se encuentre disponible
   * antes de construir o ejecutar operaciones.
   */
  private assertOpen(): void {
    if (this.estaAbierta()) {
      return;
    }

    throw new MikrotikSshError(
      `La sesión SSH no está disponible. Estado actual: ${this.estado}.`,
      {
        codigo: CodigoErrorMikrotikSsh.CONEXION_PERDIDA,

        fase: FaseFalloMikrotikSsh.EJECUCION,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: true,

        cause: this.lastClientError ?? undefined,
      },
    );
  }

  /**
   * Cierra el Client SSH.
   *
   * El cierre es idempotente a nivel de la sesión:
   * cerrar() conserva y reutiliza closePromise.
   */
  private async closeInternal(): Promise<void> {
    if (this.estado === EstadoSesionMikrotikSsh.CERRADA) {
      return;
    }

    this.estado = EstadoSesionMikrotikSsh.CERRANDO;

    const startedAt = Date.now();

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      let timeout: NodeJS.Timeout | null = null;

      const cleanup = (): void => {
        if (timeout) {
          clearTimeout(timeout);

          timeout = null;
        }

        this.client.removeListener('close', onClose);

        this.client.removeListener('error', onError);
      };

      const finish = (): void => {
        if (settled) {
          return;
        }

        settled = true;

        cleanup();

        this.estado = EstadoSesionMikrotikSsh.CERRADA;

        resolve();
      };

      const fail = (cause?: unknown): void => {
        if (settled) {
          return;
        }

        settled = true;

        cleanup();

        this.estado = EstadoSesionMikrotikSsh.FALLIDA;

        reject(
          new MikrotikSshError(
            'No pudo cerrarse correctamente la sesión SSH.',
            {
              codigo: CodigoErrorMikrotikSsh.CIERRE_SESION_FALLIDO,

              fase: FaseFalloMikrotikSsh.CIERRE,

              efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: false,

              duracionMs: Math.max(0, Date.now() - startedAt),

              cause,
            },
          ),
        );
      };

      const onClose = (): void => {
        finish();
      };

      const onError = (cause: Error): void => {
        fail(cause);
      };

      this.client.once('close', onClose);

      this.client.once('error', onError);

      timeout = setTimeout(
        () => {
          fail(new Error('Timeout al cerrar la conexión SSH.'));
        },

        this.config.closeTimeoutMs,
      );

      try {
        this.client.end();
      } catch (cause) {
        fail(cause);
      }
    });
  }

  /**
   * Escucha errores o cierres inesperados
   * provenientes del Client de ssh2.
   */
  private attachClientListeners(): void {
    this.client.on('error', this.handleClientError);

    this.client.on('end', this.handleClientEnd);

    this.client.on('close', this.handleClientClose);
  }

  private detachClientListeners(): void {
    this.client.removeListener('error', this.handleClientError);

    this.client.removeListener('end', this.handleClientEnd);

    this.client.removeListener('close', this.handleClientClose);
  }

  private readonly handleClientError = (error: Error): void => {
    this.lastClientError = error;

    if (
      this.estado !== EstadoSesionMikrotikSsh.CERRANDO &&
      this.estado !== EstadoSesionMikrotikSsh.CERRADA
    ) {
      this.estado = EstadoSesionMikrotikSsh.FALLIDA;
    }
  };

  private readonly handleClientEnd = (): void => {
    if (this.estado === EstadoSesionMikrotikSsh.ABIERTA) {
      this.estado = EstadoSesionMikrotikSsh.FALLIDA;
    }
  };

  private readonly handleClientClose = (): void => {
    this.estado = EstadoSesionMikrotikSsh.CERRADA;

    this.detachClientListeners();
  };

  /**
   * Une los comandos sanitizados ejecutados dentro
   * de una operación compuesta.
   *
   * Nunca contiene credenciales PPPoE.
   */
  private joinSanitizedCommands(commands: string[]): string {
    return commands.join(' -> ');
  }
}

// import { Client } from 'ssh2';

// import {
//   CodigoErrorMikrotikSsh,
//   EfectoRemotoMikrotik,
//   EstadoSesionMikrotikSsh,
//   FaseFalloMikrotikSsh,
// } from '../../domain/enums/mikrotik-ssh.enums';

// import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

// import { MikrotikSshSessionPort } from '../../domain/ports/mikrotik-ssh-session.port';

// import { ConfiguracionMikrotikSsh } from '../../domain/props/mikrotik-ssh-config.props';

// import {
//   BuscarSecretMikrotikParams,
//   ConfirmarSecretMikrotikParams,
//   CrearSecretMikrotikParams,
//   GestionarSecretMikrotikParams,
//   RemoverSesionActivaMikrotikParams,
// } from '../../domain/props/mikrotik-ssh-secret.props';

// import { SesionMikrotikSshInfo } from '../../domain/props/mikrotik-ssh-session.props';

// import {
//   BuscarSecretMikrotikResult,
//   ConfirmarSecretMikrotikResult,
//   CrearSecretMikrotikResult,
//   GestionarSecretMikrotikResult,
//   RemoverSesionActivaMikrotikResult,
// } from '../../domain/results/mikrotik-ssh-secret.result';

// import { MikrotikPppoeCommandBuilder } from '../routeros/mikrotik-pppoe-command.builder';

// import { MikrotikPppoeResponseParser } from '../routeros/mikrotik-pppoe-response.parser';

// import { ComandoRouterOsConstruido } from '../routeros/types/routeros-command.types';

// import { MikrotikSshCommandExecutor } from './mikrotik-ssh-command.executor';

// import {
//   FaseComandoMikrotikSsh,
//   ResultadoEjecucionComandoMikrotikSsh,
// } from './types/mikrotik-ssh-command.types';

// /**
//  * Sesión SSH individual contra un router MikroTik.
//  *
//  * Cada instancia administra un solo Client conectado.
//  */
// export class MikrotikSshSession implements MikrotikSshSessionPort {
//   private estado: EstadoSesionMikrotikSsh = EstadoSesionMikrotikSsh.ABIERTA;

//   private readonly info: SesionMikrotikSshInfo;

//   /**
//    * Serializa los comandos enviados por esta sesión.
//    *
//    * Evita ejecutar dos comandos simultáneamente
//    * sobre el mismo Client.
//    */
//   private commandQueue: Promise<void> = Promise.resolve();

//   private closePromise: Promise<void> | null = null;

//   private lastClientError: Error | null = null;

//   constructor(
//     private readonly client: Client,

//     info: SesionMikrotikSshInfo,

//     private readonly config: ConfiguracionMikrotikSsh,

//     private readonly commandBuilder: MikrotikPppoeCommandBuilder,

//     private readonly commandExecutor: MikrotikSshCommandExecutor,

//     private readonly responseParser: MikrotikPppoeResponseParser,
//   ) {
//     this.info = {
//       ...info,

//       conectadoEn: new Date(info.conectadoEn.getTime()),
//     };

//     this.attachClientListeners();
//   }

//   obtenerInfo(): SesionMikrotikSshInfo {
//     return {
//       ...this.info,

//       conectadoEn: new Date(this.info.conectadoEn.getTime()),
//     };
//   }

//   estaAbierta(): boolean {
//     return this.estado === EstadoSesionMikrotikSsh.ABIERTA;
//   }

//   buscarSecret(
//     params: BuscarSecretMikrotikParams,
//   ): Promise<BuscarSecretMikrotikResult> {
//     return this.enqueueCommand(() =>
//       this.buscarSecretInternal(
//         params,

//         FaseFalloMikrotikSsh.EJECUCION,

//         EfectoRemotoMikrotik.NO_INICIADO,
//       ),
//     );
//   }

//   crearSecret(
//     params: CrearSecretMikrotikParams,
//   ): Promise<CrearSecretMikrotikResult> {
//     return this.enqueueCommand(async () => {
//       this.assertOpen();

//       const command = this.commandBuilder.construirCrearSecret(params);

//       const execution = await this.executeCommand(
//         command,

//         FaseFalloMikrotikSsh.EJECUCION,

//         EfectoRemotoMikrotik.POSIBLE,
//       );

//       return this.responseParser.parseCrearSecret(execution, params);
//     });
//   }

//   habilitarSecret(
//     params: GestionarSecretMikrotikParams,
//   ): Promise<GestionarSecretMikrotikResult> {
//     return this.enqueueCommand(() =>
//       this.gestionarSecretInternal(params, 'HABILITAR'),
//     );
//   }

//   deshabilitarSecret(
//     params: GestionarSecretMikrotikParams,
//   ): Promise<GestionarSecretMikrotikResult> {
//     return this.enqueueCommand(() =>
//       this.gestionarSecretInternal(params, 'DESHABILITAR'),
//     );
//   }

//   eliminarSecret(
//     params: GestionarSecretMikrotikParams,
//   ): Promise<GestionarSecretMikrotikResult> {
//     return this.enqueueCommand(() =>
//       this.gestionarSecretInternal(params, 'ELIMINAR'),
//     );
//   }

//   confirmarSecret(
//     params: ConfirmarSecretMikrotikParams,
//   ): Promise<ConfirmarSecretMikrotikResult> {
//     return this.enqueueCommand(async () => {
//       this.assertOpen();

//       /**
//        * La consulta forma parte de la confirmación.
//        *
//        * Si falla después de una mutación, el efecto remoto
//        * debe considerarse posible.
//        */
//       const search = await this.buscarSecretInternal(
//         {
//           usuarioPppoe: params.usuarioPppoe,
//         },

//         FaseFalloMikrotikSsh.CONFIRMACION,

//         EfectoRemotoMikrotik.POSIBLE,
//       );

//       return this.responseParser.confirmarSecret(search, params);
//     });
//   }

//   removerSesionActiva(
//     params: RemoverSesionActivaMikrotikParams,
//   ): Promise<RemoverSesionActivaMikrotikResult> {
//     return this.enqueueCommand(() => this.removerSesionActivaInternal(params));
//   }

//   /**
//    * El cierre se agrega al final de la cola.
//    *
//    * Así no interrumpe un comando que todavía se encuentra
//    * en ejecución.
//    */
//   cerrar(): Promise<void> {
//     if (this.closePromise) {
//       return this.closePromise;
//     }

//     this.closePromise = this.enqueueCommand(() => this.closeInternal());

//     return this.closePromise;
//   }

//   private async buscarSecretInternal(
//     params: BuscarSecretMikrotikParams,
//     fase: FaseComandoMikrotikSsh,
//     efectoRemoto: EfectoRemotoMikrotik,
//   ): Promise<BuscarSecretMikrotikResult> {
//     this.assertOpen();

//     const command = this.commandBuilder.construirBuscarSecret(params);

//     const execution = await this.executeCommand(command, fase, efectoRemoto);

//     return this.parseWithContext(
//       () => this.responseParser.parseBuscarSecret(execution, params),

//       fase,

//       efectoRemoto,
//     );
//   }

//   private async gestionarSecretInternal(
//     params: GestionarSecretMikrotikParams,
//     accion: 'HABILITAR' | 'DESHABILITAR' | 'ELIMINAR',
//   ): Promise<GestionarSecretMikrotikResult> {
//     this.assertOpen();

//     const command = this.buildSecretManagementCommand(params, accion);

//     const execution = await this.executeCommand(
//       command,

//       FaseFalloMikrotikSsh.EJECUCION,

//       EfectoRemotoMikrotik.POSIBLE,
//     );

//     return this.responseParser.parseGestionSecret(execution, params, accion);
//   }

//   private async removerSesionActivaInternal(
//     params: RemoverSesionActivaMikrotikParams,
//   ): Promise<RemoverSesionActivaMikrotikResult> {
//     this.assertOpen();

//     const before = await this.buscarSesionesActivasInternal(
//       params,

//       FaseFalloMikrotikSsh.EJECUCION,

//       EfectoRemotoMikrotik.NO_INICIADO,
//     );

//     const sesionesEncontradas = before.sesiones.length;

//     if (sesionesEncontradas === 0) {
//       return {
//         usuarioPppoe: params.usuarioPppoe,

//         sesionesEncontradas: 0,

//         sesionesRemovidas: 0,

//         sesionesRestantes: 0,

//         sesiones: [],

//         duracionMs: before.duracionMs,

//         comandoSanitizado: before.comandoSanitizado,

//         respuestaSanitizada: 'No había sesiones PPPoE activas para remover.',
//       };
//     }

//     const removeCommand =
//       this.commandBuilder.construirRemoverSesionesActivas(params);

//     const removeExecution = await this.executeCommand(
//       removeCommand,

//       FaseFalloMikrotikSsh.EJECUCION,

//       EfectoRemotoMikrotik.POSIBLE,
//     );

//     const removal = this.responseParser.parseRemoverSesionesActivas(
//       removeExecution,
//       params,
//     );

//     if (removal.sesionesRemovidasReportadas !== sesionesEncontradas) {
//       throw new MikrotikSshError(
//         'RouterOS reportó una cantidad inesperada de sesiones removidas.',
//         {
//           codigo: CodigoErrorMikrotikSsh.RESPUESTA_INVALIDA,

//           fase: FaseFalloMikrotikSsh.CONFIRMACION,

//           efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

//           reintentable: true,

//           duracionMs: before.duracionMs + removeExecution.duracionMs,
//         },
//       );
//     }

//     /**
//      * Se consulta nuevamente para comprobar
//      * que no permanecen sesiones activas.
//      */
//     const after = await this.buscarSesionesActivasInternal(
//       params,

//       FaseFalloMikrotikSsh.CONFIRMACION,

//       EfectoRemotoMikrotik.POSIBLE,
//     );

//     const sesionesRestantes = after.sesiones.length;

//     const totalDuration =
//       before.duracionMs + removeExecution.duracionMs + after.duracionMs;

//     if (sesionesRestantes > 0) {
//       throw new MikrotikSshError(
//         `Permanecen ${sesionesRestantes} sesiones PPPoE activas después de solicitar su remoción.`,
//         {
//           codigo: CodigoErrorMikrotikSsh.SESION_NO_CONFIRMADA,

//           fase: FaseFalloMikrotikSsh.CONFIRMACION,

//           efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

//           reintentable: true,

//           duracionMs: totalDuration,
//         },
//       );
//     }

//     return {
//       usuarioPppoe: params.usuarioPppoe,

//       sesionesEncontradas,

//       sesionesRemovidas: sesionesEncontradas,

//       sesionesRestantes: 0,

//       /**
//        * Contiene los snapshots encontrados
//        * antes de la remoción.
//        */
//       sesiones: before.sesiones,

//       duracionMs: totalDuration,

//       comandoSanitizado: this.joinSanitizedCommands([
//         before.comandoSanitizado,

//         removal.comandoSanitizado,

//         after.comandoSanitizado,
//       ]),

//       respuestaSanitizada: `Se removieron y confirmaron ${sesionesEncontradas} sesiones PPPoE activas.`,
//     };
//   }

//   private async buscarSesionesActivasInternal(
//     params: RemoverSesionActivaMikrotikParams,
//     fase: FaseComandoMikrotikSsh,
//     efectoRemoto: EfectoRemotoMikrotik,
//   ) {
//     this.assertOpen();

//     const command = this.commandBuilder.construirBuscarSesionesActivas(params);

//     const execution = await this.executeCommand(command, fase, efectoRemoto);

//     return this.parseWithContext(
//       () => this.responseParser.parseBuscarSesionesActivas(execution, params),

//       fase,

//       efectoRemoto,
//     );
//   }

//   private buildSecretManagementCommand(
//     params: GestionarSecretMikrotikParams,
//     accion: 'HABILITAR' | 'DESHABILITAR' | 'ELIMINAR',
//   ): ComandoRouterOsConstruido {
//     switch (accion) {
//       case 'HABILITAR':
//         return this.commandBuilder.construirHabilitarSecret(params);

//       case 'DESHABILITAR':
//         return this.commandBuilder.construirDeshabilitarSecret(params);

//       case 'ELIMINAR':
//         return this.commandBuilder.construirEliminarSecret(params);
//     }
//   }

//   private executeCommand(
//     command: ComandoRouterOsConstruido,
//     fase: FaseComandoMikrotikSsh,
//     efectoRemoto: EfectoRemotoMikrotik,
//   ): Promise<ResultadoEjecucionComandoMikrotikSsh> {
//     return this.commandExecutor.execute(this.client, this.config, {
//       comando: command.comando,

//       comandoSanitizado: command.comandoSanitizado,

//       fase,

//       efectoRemotoEnFallo: efectoRemoto,
//     });
//   }

//   /**
//    * El parser originalmente procesa consultas normales.
//    *
//    * Cuando una consulta pertenece a CONFIRMACION,
//    * normalizamos el contexto del error.
//    */
//   private parseWithContext<T>(
//     callback: () => T,
//     fase: FaseComandoMikrotikSsh,
//     efectoRemoto: EfectoRemotoMikrotik,
//   ): T {
//     try {
//       return callback();
//     } catch (error) {
//       if (!MikrotikSshError.is(error)) {
//         throw error;
//       }

//       if (error.fase === fase && error.efectoRemoto === efectoRemoto) {
//         throw error;
//       }

//       throw new MikrotikSshError(error.message, {
//         codigo: error.codigo,

//         fase,

//         efectoRemoto,

//         reintentable: error.reintentable,

//         duracionMs: error.duracionMs,

//         cause: error,
//       });
//     }
//   }

//   /**
//    * Ejecuta cada tarea después de la anterior,
//    * incluso cuando la tarea anterior falló.
//    */
//   private enqueueCommand<T>(callback: () => Promise<T>): Promise<T> {
//     const execution = this.commandQueue.then(callback, callback);

//     this.commandQueue = execution.then(
//       () => undefined,
//       () => undefined,
//     );

//     return execution;
//   }

//   private assertOpen(): void {
//     if (this.estaAbierta()) {
//       return;
//     }

//     throw new MikrotikSshError(
//       `La sesión SSH no está disponible. Estado actual: ${this.estado}.`,
//       {
//         codigo: CodigoErrorMikrotikSsh.CONEXION_PERDIDA,

//         fase: FaseFalloMikrotikSsh.EJECUCION,

//         efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

//         reintentable: true,

//         cause: this.lastClientError ?? undefined,
//       },
//     );
//   }

//   private async closeInternal(): Promise<void> {
//     if (this.estado === EstadoSesionMikrotikSsh.CERRADA) {
//       return;
//     }

//     this.estado = EstadoSesionMikrotikSsh.CERRANDO;

//     const startedAt = Date.now();

//     return new Promise<void>((resolve, reject) => {
//       let settled = false;

//       let timeout: NodeJS.Timeout | null = null;

//       const cleanup = (): void => {
//         if (timeout) {
//           clearTimeout(timeout);

//           timeout = null;
//         }

//         this.client.removeListener('close', onClose);

//         this.client.removeListener('error', onError);
//       };

//       const finish = (): void => {
//         if (settled) {
//           return;
//         }

//         settled = true;

//         cleanup();

//         this.estado = EstadoSesionMikrotikSsh.CERRADA;

//         resolve();
//       };

//       const fail = (cause?: unknown): void => {
//         if (settled) {
//           return;
//         }

//         settled = true;

//         cleanup();

//         this.estado = EstadoSesionMikrotikSsh.FALLIDA;

//         reject(
//           new MikrotikSshError(
//             'No pudo cerrarse correctamente la sesión SSH.',
//             {
//               codigo: CodigoErrorMikrotikSsh.CIERRE_SESION_FALLIDO,

//               fase: FaseFalloMikrotikSsh.CIERRE,

//               efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

//               reintentable: false,

//               duracionMs: Math.max(0, Date.now() - startedAt),

//               cause,
//             },
//           ),
//         );
//       };

//       const onClose = (): void => {
//         finish();
//       };

//       const onError = (cause: Error): void => {
//         fail(cause);
//       };

//       this.client.once('close', onClose);

//       this.client.once('error', onError);

//       timeout = setTimeout(
//         () => {
//           fail(new Error('Timeout al cerrar la conexión SSH.'));
//         },

//         this.config.closeTimeoutMs,
//       );

//       try {
//         this.client.end();
//       } catch (cause) {
//         fail(cause);
//       }
//     });
//   }

//   private attachClientListeners(): void {
//     this.client.on('error', this.handleClientError);

//     this.client.on('end', this.handleClientEnd);

//     this.client.on('close', this.handleClientClose);
//   }

//   private detachClientListeners(): void {
//     this.client.removeListener('error', this.handleClientError);

//     this.client.removeListener('end', this.handleClientEnd);

//     this.client.removeListener('close', this.handleClientClose);
//   }

//   private readonly handleClientError = (error: Error): void => {
//     this.lastClientError = error;

//     if (
//       this.estado !== EstadoSesionMikrotikSsh.CERRANDO &&
//       this.estado !== EstadoSesionMikrotikSsh.CERRADA
//     ) {
//       this.estado = EstadoSesionMikrotikSsh.FALLIDA;
//     }
//   };

//   private readonly handleClientEnd = (): void => {
//     if (this.estado === EstadoSesionMikrotikSsh.ABIERTA) {
//       this.estado = EstadoSesionMikrotikSsh.FALLIDA;
//     }
//   };

//   private readonly handleClientClose = (): void => {
//     this.estado = EstadoSesionMikrotikSsh.CERRADA;

//     this.detachClientListeners();
//   };

//   private joinSanitizedCommands(commands: string[]): string {
//     return commands.join(' -> ');
//   }
// }
