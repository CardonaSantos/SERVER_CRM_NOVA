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
  BuscarSecretMikrotikResult,
  ConfirmarSecretMikrotikResult,
  CrearSecretMikrotikResult,
  GestionarSecretMikrotikResult,
  RemoverSesionActivaMikrotikResult,
} from '../../domain/results/mikrotik-ssh-secret.result';

import { MikrotikPppoeCommandBuilder } from '../routeros/mikrotik-pppoe-command.builder';

import { MikrotikPppoeResponseParser } from '../routeros/mikrotik-pppoe-response.parser';

import { ComandoRouterOsConstruido } from '../routeros/types/routeros-command.types';

import { MikrotikSshCommandExecutor } from './mikrotik-ssh-command.executor';

import {
  FaseComandoMikrotikSsh,
  ResultadoEjecucionComandoMikrotikSsh,
} from './types/mikrotik-ssh-command.types';

/**
 * Sesión SSH individual contra un router MikroTik.
 *
 * Cada instancia administra un solo Client conectado.
 */
export class MikrotikSshSession implements MikrotikSshSessionPort {
  private estado: EstadoSesionMikrotikSsh = EstadoSesionMikrotikSsh.ABIERTA;

  private readonly info: SesionMikrotikSshInfo;

  /**
   * Serializa los comandos enviados por esta sesión.
   *
   * Evita ejecutar dos comandos simultáneamente
   * sobre el mismo Client.
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

  habilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.gestionarSecretInternal(params, 'HABILITAR'),
    );
  }

  deshabilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.gestionarSecretInternal(params, 'DESHABILITAR'),
    );
  }

  eliminarSecret(
    params: GestionarSecretMikrotikParams,
  ): Promise<GestionarSecretMikrotikResult> {
    return this.enqueueCommand(() =>
      this.gestionarSecretInternal(params, 'ELIMINAR'),
    );
  }

  confirmarSecret(
    params: ConfirmarSecretMikrotikParams,
  ): Promise<ConfirmarSecretMikrotikResult> {
    return this.enqueueCommand(async () => {
      this.assertOpen();

      /**
       * La consulta forma parte de la confirmación.
       *
       * Si falla después de una mutación, el efecto remoto
       * debe considerarse posible.
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

  removerSesionActiva(
    params: RemoverSesionActivaMikrotikParams,
  ): Promise<RemoverSesionActivaMikrotikResult> {
    return this.enqueueCommand(() => this.removerSesionActivaInternal(params));
  }

  /**
   * El cierre se agrega al final de la cola.
   *
   * Así no interrumpe un comando que todavía se encuentra
   * en ejecución.
   */
  cerrar(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }

    this.closePromise = this.enqueueCommand(() => this.closeInternal());

    return this.closePromise;
  }

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

  private async gestionarSecretInternal(
    params: GestionarSecretMikrotikParams,
    accion: 'HABILITAR' | 'DESHABILITAR' | 'ELIMINAR',
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

  private async removerSesionActivaInternal(
    params: RemoverSesionActivaMikrotikParams,
  ): Promise<RemoverSesionActivaMikrotikResult> {
    this.assertOpen();

    const before = await this.buscarSesionesActivasInternal(
      params,

      FaseFalloMikrotikSsh.EJECUCION,

      EfectoRemotoMikrotik.NO_INICIADO,
    );

    const sesionesEncontradas = before.sesiones.length;

    if (sesionesEncontradas === 0) {
      return {
        usuarioPppoe: params.usuarioPppoe,

        sesionesEncontradas: 0,

        sesionesRemovidas: 0,

        sesionesRestantes: 0,

        sesiones: [],

        duracionMs: before.duracionMs,

        comandoSanitizado: before.comandoSanitizado,

        respuestaSanitizada: 'No había sesiones PPPoE activas para remover.',
      };
    }

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

    if (removal.sesionesRemovidasReportadas !== sesionesEncontradas) {
      throw new MikrotikSshError(
        'RouterOS reportó una cantidad inesperada de sesiones removidas.',
        {
          codigo: CodigoErrorMikrotikSsh.RESPUESTA_INVALIDA,

          fase: FaseFalloMikrotikSsh.CONFIRMACION,

          efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

          reintentable: true,

          duracionMs: before.duracionMs + removeExecution.duracionMs,
        },
      );
    }

    /**
     * Se consulta nuevamente para comprobar
     * que no permanecen sesiones activas.
     */
    const after = await this.buscarSesionesActivasInternal(
      params,

      FaseFalloMikrotikSsh.CONFIRMACION,

      EfectoRemotoMikrotik.POSIBLE,
    );

    const sesionesRestantes = after.sesiones.length;

    const totalDuration =
      before.duracionMs + removeExecution.duracionMs + after.duracionMs;

    if (sesionesRestantes > 0) {
      throw new MikrotikSshError(
        `Permanecen ${sesionesRestantes} sesiones PPPoE activas después de solicitar su remoción.`,
        {
          codigo: CodigoErrorMikrotikSsh.SESION_NO_CONFIRMADA,

          fase: FaseFalloMikrotikSsh.CONFIRMACION,

          efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

          reintentable: true,

          duracionMs: totalDuration,
        },
      );
    }

    return {
      usuarioPppoe: params.usuarioPppoe,

      sesionesEncontradas,

      sesionesRemovidas: sesionesEncontradas,

      sesionesRestantes: 0,

      /**
       * Contiene los snapshots encontrados
       * antes de la remoción.
       */
      sesiones: before.sesiones,

      duracionMs: totalDuration,

      comandoSanitizado: this.joinSanitizedCommands([
        before.comandoSanitizado,

        removal.comandoSanitizado,

        after.comandoSanitizado,
      ]),

      respuestaSanitizada: `Se removieron y confirmaron ${sesionesEncontradas} sesiones PPPoE activas.`,
    };
  }

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

  private buildSecretManagementCommand(
    params: GestionarSecretMikrotikParams,
    accion: 'HABILITAR' | 'DESHABILITAR' | 'ELIMINAR',
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
   * El parser originalmente procesa consultas normales.
   *
   * Cuando una consulta pertenece a CONFIRMACION,
   * normalizamos el contexto del error.
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
   * incluso cuando la tarea anterior falló.
   */
  private enqueueCommand<T>(callback: () => Promise<T>): Promise<T> {
    const execution = this.commandQueue.then(callback, callback);

    this.commandQueue = execution.then(
      () => undefined,
      () => undefined,
    );

    return execution;
  }

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

  private joinSanitizedCommands(commands: string[]): string {
    return commands.join(' -> ');
  }
}
