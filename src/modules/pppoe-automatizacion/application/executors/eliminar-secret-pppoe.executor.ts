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

export type EjecutarEliminarSecretPppoeParams = {
  contexto: ContextoEjecucionPppoe;

  pasos: PppoeOperacionPasoEntity[];
};

/**
 * Elimina definitivamente un secret PPPoE.
 *
 * Flujo:
 *
 * 1. conectar;
 * 2. buscar;
 * 3. deshabilitar;
 * 4. remover sesiones;
 * 5. eliminar;
 * 6. confirmar que ya no existe.
 *
 * Cuando el secret ya no existe, los pasos modificadores
 * se omiten y la confirmación final continúa.
 */
@Injectable()
export class EliminarSecretPppoeExecutor {
  constructor(
    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,

    private readonly stepRunner: PppoeOperacionStepRunnerService,
  ) {}

  async execute(
    params: EjecutarEliminarSecretPppoeParams,
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

    const codigoPerfil = contexto.perfil.codigoPerfil;

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

    const ordenEliminar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.ELIMINAR_SECRET,
    );

    const ordenConfirmar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONFIRMAR_SECRET,
    );

    let session: MikrotikSshSessionPort | null = null;

    let secretEncontrado = false;

    let deshabilitacionOmitida = false;

    let remocionSesionOmitida = false;

    let eliminacionOmitida = false;

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
       * 2. BUSCAR SECRET
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

      secretEncontrado =
        searchResult.encontrado && searchResult.secret !== null;

      /*
       * El estado remoto deseado ya se cumple.
       *
       * No se considera error que el secret haya sido
       * eliminado anteriormente.
       */
      if (!searchResult.encontrado || !searchResult.secret) {
        deshabilitacionOmitida = true;

        remocionSesionOmitida = true;

        eliminacionOmitida = true;

        await this.stepRunner.omitir({
          empresaId,

          operacionId,

          orden: ordenDeshabilitar,

          motivo: 'El secret PPPoE no existe en el router.',
        });

        await this.stepRunner.omitir({
          empresaId,

          operacionId,

          orden: ordenRemoverSesion,

          motivo: 'No existe un secret PPPoE asociado a sesiones activas.',
        });

        await this.stepRunner.omitir({
          empresaId,

          operacionId,

          orden: ordenEliminar,

          motivo: 'El secret PPPoE ya se encuentra eliminado.',
        });
      } else {
        const secret = searchResult.secret;

        /*
         * Evita eliminar un secret que conserve el mismo
         * usuario, pero pertenezca a otro perfil.
         */
        if (secret.codigoPerfil !== codigoPerfil) {
          await this.stepRunner.ejecutar({
            empresaId,

            operacionId,

            orden: ordenDeshabilitar,

            comandoSanitizado: `VALIDAR_PERFIL_SECRET usuario=${usuarioPppoe}`,

            ejecutar: async () => {
              throw new PppoeOperacionStepError({
                errorCodigo: CodigoErrorMikrotikSsh.PERFIL_NO_COINCIDE,

                errorMensaje:
                  'El perfil del secret remoto no coincide con la homologación asignada.',

                efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

                reintentable: false,

                fase: FaseFalloMikrotikSsh.EJECUCION,
              });
            },
          });

          throw new Error(
            'Flujo inesperado después de registrar PERFIL_NO_COINCIDE.',
          );
        }

        /*
         * ====================================================
         * 3. DESHABILITAR SECRET
         * ====================================================
         */

        if (secret.deshabilitado) {
          deshabilitacionOmitida = true;

          await this.stepRunner.omitir({
            empresaId,

            operacionId,

            orden: ordenDeshabilitar,

            motivo: 'El secret PPPoE ya se encuentra deshabilitado.',
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
        }

        /*
         * ====================================================
         * 4. REMOVER SESIONES ACTIVAS
         * ====================================================
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

        /*
         * ====================================================
         * 5. ELIMINAR SECRET
         * ====================================================
         */

        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenEliminar,

          comandoSanitizado: `ELIMINAR_SECRET usuario=${usuarioPppoe}`,

          ejecutar: async () => {
            const result = await activeSession.eliminarSecret({
              usuarioPppoe,
            });

            return {
              value: result,

              respuestaSanitizada: result.respuestaSanitizada,
            };
          },
        });
      }

      /*
       * ======================================================
       * 6. CONFIRMAR AUSENCIA
       * ======================================================
       */

      const confirmationResult = await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenConfirmar,

        comandoSanitizado: `CONFIRMAR_SECRET usuario=${usuarioPppoe} debeExistir=false`,

        ejecutar: async () => {
          const result = await activeSession.confirmarSecret({
            usuarioPppoe,

            debeExistir: false,
          });

          return {
            value: result,

            respuestaSanitizada: result.respuestaSanitizada,
          };
        },
      });

      return {
        secretEncontrado,

        deshabilitacionOmitida,

        remocionSesionOmitida,

        eliminacionOmitida,

        secretEliminado: confirmationResult.confirmado,

        secretExisteDespues: confirmationResult.secretActual !== null,
      };
    } finally {
      await this.closeSessionSafely(session);
    }
  }

  private validateContext(contexto: ContextoEjecucionPppoe): void {
    if (contexto.operacion.tipo !== TipoOperacionPppoe.ELIMINAR_SECRET) {
      throw new ConflictException(
        `EliminarSecretPppoeExecutor no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
      );
    }

    if (contexto.cuenta.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE debe estar persistida antes de eliminar el secret.',
      );
    }

    if (contexto.cuenta.empresaId !== contexto.operacion.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE y la operación pertenecen a empresas diferentes.',
      );
    }

    /*
     * ELIMINAR_SECRET no necesita descifrar
     * la contraseña PPPoE.
     */
    if (contexto.passwordPppoe !== null) {
      throw new ConflictException(
        'ELIMINAR_SECRET no debe contener la contraseña PPPoE descifrada.',
      );
    }
  }

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
       * El fallo secundario de cierre no sustituye
       * el resultado funcional de la operación.
       */
    }
  }
}
