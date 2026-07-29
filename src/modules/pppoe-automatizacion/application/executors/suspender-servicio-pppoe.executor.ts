import { ConflictException, Inject, Injectable } from '@nestjs/common';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
  MetodoAutenticacionMikrotikSsh,
} from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';

import { PppoeOperacionPasoEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion-paso.entity';

import {
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { PppoeOperacionResultado } from 'src/modules/pppoe-operacion/domain/props/pppoe-operacion.props';

import { PppoeOperacionStepError } from '../errors/pppoe-operacion-step.error';

import { ContextoEjecucionPppoe } from '../models/contexto-ejecucion-pppoe.model';

import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';

export type EjecutarSuspenderServicioPppoeParams = {
  contexto: ContextoEjecucionPppoe;

  pasos: PppoeOperacionPasoEntity[];
};

/**
 * Ejecuta el plan técnico de SUSPENDER_SERVICIO:
 *
 * 1. CONECTAR_ROUTER
 * 2. BUSCAR_SECRET
 * 3. DESHABILITAR_SECRET u OMITIR
 * 4. REMOVER_SESION_ACTIVA
 * 5. CONFIRMAR_SECRET
 *
 * La sesión activa se elimina aunque el secret ya estuviera
 * deshabilitado, porque el cliente podría conservar una
 * conexión PPPoE establecida previamente.
 */
@Injectable()
export class SuspenderServicioPppoeExecutor {
  constructor(
    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,

    private readonly stepRunner: PppoeOperacionStepRunnerService,
  ) {}

  async execute(
    params: EjecutarSuspenderServicioPppoeParams,
  ): Promise<PppoeOperacionResultado> {
    const { contexto, pasos } = params;

    this.validateContext(contexto);

    const operacionId = contexto.operacion.id;

    if (operacionId === null) {
      throw new ConflictException(
        'La operación PPPoE debe estar persistida antes de ejecutarse.',
      );
    }

    const empresaId = contexto.operacion.empresaId;

    const usuarioPppoe = contexto.cuenta.usuario;

    const perfilProps = contexto.perfil.toPrimitives();

    const codigoPerfil = perfilProps.codigoPerfil;

    const ordenConectar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONECTAR_ROUTER,
    );

    const ordenBuscar = this.getStepOrder(pasos, TipoPasoPppoe.BUSCAR_SECRET);

    const ordenDeshabilitar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.DESHABILITAR_SECRET,
    );

    const ordenRemoverSesion = this.getStepOrder(
      pasos,
      TipoPasoPppoe.REMOVER_SESION_ACTIVA,
    );

    const ordenConfirmar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONFIRMAR_SECRET,
    );

    let session: MikrotikSshSessionPort | null = null;

    let deshabilitacionOmitida = false;

    let comandoDeshabilitarEjecutado = false;

    let remocionSesionEjecutada = false;

    try {
      /*
       * ======================================================
       * 1. CONECTAR AL ROUTER
       * ======================================================
       */

      await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenConectar,

        comandoSanitizado:
          `CONECTAR_ROUTER host=${contexto.router.host} ` +
          `port=${contexto.router.port} ` +
          `username=${contexto.router.username}`,

        ejecutar: async () => {
          session = await this.mikrotikSsh.abrirSesion({
            host: contexto.router.host,

            port: contexto.router.port,

            username: contexto.router.username,

            autenticacion: {
              metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

              password: contexto.router.password,
            },

            /*
             * Integración inicial.
             *
             * Posteriormente se sustituirá por la
             * verificación estricta de fingerprint.
             */
            verificacionHost: {
              verificar: false,
            },
          });

          const info = session.obtenerInfo();

          return {
            value: true,

            respuestaSanitizada: `Sesión SSH abierta contra ${info.host}:${info.port}.`,
          };
        },
      });

      const activeSession = this.requireOpenSession(session);

      /*
       * ======================================================
       * 2. BUSCAR EL SECRET
       * ======================================================
       */

      const searchResult = await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenBuscar,

        comandoSanitizado: `BUSCAR_SECRET usuario=${usuarioPppoe}`,

        ejecutar: async () => {
          const result = await activeSession.buscarSecret({
            usuarioPppoe,
          });

          return {
            value: result,

            respuestaSanitizada: result.respuestaSanitizada,
          };
        },
      });

      /*
       * ======================================================
       * 3. DESHABILITAR U OMITIR
       * ======================================================
       */

      if (!searchResult.encontrado || !searchResult.secret) {
        /*
         * No marcamos la cuenta como suspendida cuando el
         * secret desapareció del router.
         *
         * Ese caso representa una inconsistencia que debe
         * revisarse antes de sincronizar el estado local.
         */
        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenDeshabilitar,

          comandoSanitizado: `DESHABILITAR_SECRET usuario=${usuarioPppoe}`,

          ejecutar: async () => {
            throw new PppoeOperacionStepError({
              errorCodigo: CodigoErrorMikrotikSsh.SECRET_NO_ENCONTRADO,

              errorMensaje: `No existe el secret PPPoE ${usuarioPppoe} en el router.`,

              efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: true,

              fase: FaseFalloMikrotikSsh.EJECUCION,
            });
          },
        });

        throw new Error(
          'Flujo inesperado después de registrar SECRET_NO_ENCONTRADO.',
        );
      }

      const secretEncontrado = searchResult.secret;

      if (secretEncontrado.deshabilitado) {
        deshabilitacionOmitida = true;

        await this.stepRunner.omitir({
          empresaId,

          operacionId,

          orden: ordenDeshabilitar,

          motivo: 'El secret PPPoE ya se encuentra deshabilitado en el router.',
        });
      } else {
        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenDeshabilitar,

          comandoSanitizado: `DESHABILITAR_SECRET usuario=${usuarioPppoe}`,

          ejecutar: async () => {
            const result = await activeSession.deshabilitarSecret({
              usuarioPppoe,
            });

            return {
              value: result,

              respuestaSanitizada: result.respuestaSanitizada,
            };
          },
        });

        comandoDeshabilitarEjecutado = true;
      }

      /*
       * ======================================================
       * 4. REMOVER SESIÓN ACTIVA
       * ======================================================
       *
       * Es una acción idempotente.
       *
       * Si el cliente no tiene una sesión activa, el método
       * debe devolver éxito con cero sesiones eliminadas.
       */

      await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenRemoverSesion,

        comandoSanitizado: `REMOVER_SESION_ACTIVA usuario=${usuarioPppoe}`,

        ejecutar: async () => {
          const result = await activeSession.removerSesionActiva({
            usuarioPppoe,
          });

          return {
            value: result,

            respuestaSanitizada: result.respuestaSanitizada,
          };
        },
      });

      remocionSesionEjecutada = true;

      /*
       * ======================================================
       * 5. CONFIRMAR SUSPENSIÓN
       * ======================================================
       *
       * El objetivo de esta operación es comprobar que:
       *
       * - el secret continúa existiendo;
       * - el secret quedó deshabilitado.
       *
       * El perfil se informa en el resultado, pero una
       * diferencia de perfil no impide suspender el acceso.
       */

      const confirmationResult = await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenConfirmar,

        comandoSanitizado:
          `CONFIRMAR_SECRET usuario=${usuarioPppoe} ` + 'deshabilitado=true',

        ejecutar: async () => {
          const result = await activeSession.confirmarSecret({
            debeExistir: true,

            usuarioPppoe,

            deshabilitadoEsperado: true,
          });

          return {
            value: result,

            respuestaSanitizada: result.respuestaSanitizada,
          };
        },
      });

      const secretConfirmado = confirmationResult.secretActual;

      return {
        secretEncontrado: true,

        deshabilitacionOmitida,

        comandoDeshabilitarEjecutado,

        remocionSesionEjecutada,

        secretConfirmado: confirmationResult.confirmado,

        deshabilitado: secretConfirmado?.deshabilitado === true,

        perfilCoincide: secretConfirmado?.codigoPerfil === codigoPerfil,
      };
    } finally {
      await this.closeSessionSafely(session);
    }
  }

  /**
   * Valida el contexto antes de abrir SSH.
   */
  private validateContext(contexto: ContextoEjecucionPppoe): void {
    if (contexto.operacion.tipo !== TipoOperacionPppoe.SUSPENDER_SERVICIO) {
      throw new ConflictException(
        `SuspenderServicioPppoeExecutor no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
      );
    }

    if (contexto.cuenta.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE debe estar persistida antes de suspender el servicio.',
      );
    }

    if (contexto.cuenta.empresaId !== contexto.operacion.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE y la operación pertenecen a empresas diferentes.',
      );
    }

    if (!contexto.cuenta.tieneSecretCreado) {
      throw new ConflictException(
        'La cuenta PPPoE no tiene confirmado un secret creado.',
      );
    }

    if (!contexto.cuenta.activadoEn) {
      throw new ConflictException(
        'La cuenta PPPoE nunca fue activada y no puede suspenderse.',
      );
    }

    /*
     * SUSPENDER_SERVICIO no necesita descifrar
     * la contraseña de la cuenta PPPoE.
     */
    if (contexto.passwordPppoe !== null) {
      throw new ConflictException(
        'SUSPENDER_SERVICIO no debe contener la contraseña PPPoE descifrada.',
      );
    }
  }

  /**
   * Obtiene el orden real del paso.
   *
   * Evita depender de números escritos manualmente.
   */
  private getStepOrder(
    pasos: PppoeOperacionPasoEntity[],
    tipo: TipoPasoPppoe,
  ): number {
    const matches = pasos.filter((paso) => paso.tipo === tipo);

    if (matches.length === 0) {
      throw new ConflictException(`La operación no contiene el paso ${tipo}.`);
    }

    if (matches.length > 1) {
      throw new ConflictException(
        `La operación contiene más de un paso ${tipo}.`,
      );
    }

    return matches[0].orden;
  }

  private requireOpenSession(
    session: MikrotikSshSessionPort | null,
  ): MikrotikSshSessionPort {
    if (!session || !session.estaAbierta()) {
      throw new ConflictException(
        'La sesión SSH no quedó disponible después de la conexión.',
      );
    }

    return session;
  }

  /**
   * El fallo de cierre no sustituye el resultado funcional
   * de la operación.
   */
  private async closeSessionSafely(
    session: MikrotikSshSessionPort | null,
  ): Promise<void> {
    if (!session) {
      return;
    }

    try {
      await session.cerrar();
    } catch {
      /*
       * No propagamos errores secundarios del cierre.
       */
    }
  }
}
