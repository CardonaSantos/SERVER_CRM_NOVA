import { ConflictException, Inject, Injectable } from '@nestjs/common';

import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
  MetodoAutenticacionMikrotikSsh,
} from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

import { PppoeOperacionPasoEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion-paso.entity';

import {
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { PppoeOperacionResultado } from 'src/modules/pppoe-operacion/domain/props/pppoe-operacion.props';

import { PppoeOperacionStepError } from '../errors/pppoe-operacion-step.error';

import { ContextoEjecucionPppoe } from '../models/contexto-ejecucion-pppoe.model';

import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';

export type EjecutarActivarSecretPppoeParams = {
  contexto: ContextoEjecucionPppoe;

  pasos: PppoeOperacionPasoEntity[];
};

/**
 * Ejecuta el plan técnico de ACTIVAR_SECRET:
 *
 * 1. CONECTAR_ROUTER
 * 2. BUSCAR_SECRET
 * 3. HABILITAR_SECRET u OMITIR
 * 4. CONFIRMAR_SECRET
 *
 * Utiliza una única sesión SSH durante todo el flujo.
 */
@Injectable()
export class ActivarSecretPppoeExecutor {
  constructor(
    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,

    private readonly stepRunner: PppoeOperacionStepRunnerService,
  ) {}

  async execute(
    params: EjecutarActivarSecretPppoeParams,
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

    const ordenHabilitar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.HABILITAR_SECRET,
    );

    const ordenConfirmar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONFIRMAR_SECRET,
    );

    let session: MikrotikSshSessionPort | null = null;

    let habilitacionOmitida = false;

    let comandoHabilitarEjecutado = false;

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

            /**
             * Integración inicial.
             *
             * Se sustituirá por huella estricta cuando
             * el router almacene sshFingerprintSha256.
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

      if (!session || !session.estaAbierta()) {
        throw new ConflictException(
          'La sesión SSH no quedó disponible después de la conexión.',
        );
      }

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
          const result = await session!.buscarSecret({
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
       * 3. HABILITAR U OMITIR
       * ======================================================
       */

      if (!searchResult.encontrado || !searchResult.secret) {
        /**
         * Registramos el fallo dentro del paso
         * HABILITAR_SECRET.
         *
         * No hubo una mutación remota.
         */
        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenHabilitar,

          comandoSanitizado: `HABILITAR_SECRET usuario=${usuarioPppoe}`,

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

        /**
         * El runner siempre propaga el error.
         */
        throw new Error(
          'Flujo inesperado después de registrar SECRET_NO_ENCONTRADO.',
        );
      }

      const secretActual = searchResult.secret;

      /**
       * No habilitamos un secret asociado a otro perfil.
       *
       * Primero debe corregirse la configuración remota
       * o generarse una operación administrativa específica.
       */
      if (secretActual.codigoPerfil !== codigoPerfil) {
        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenHabilitar,

          comandoSanitizado: `HABILITAR_SECRET usuario=${usuarioPppoe}`,

          ejecutar: async () => {
            throw new PppoeOperacionStepError({
              errorCodigo: CodigoErrorMikrotikSsh.PERFIL_NO_COINCIDE,

              errorMensaje: `El secret PPPoE ${usuarioPppoe} utiliza un perfil diferente al homologado.`,

              efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

              reintentable: false,

              fase: FaseFalloMikrotikSsh.CONFIRMACION,
            });
          },
        });

        throw new Error(
          'Flujo inesperado después de registrar PERFIL_NO_COINCIDE.',
        );
      }

      if (secretActual.deshabilitado === false) {
        habilitacionOmitida = true;

        await this.stepRunner.omitir({
          empresaId,

          operacionId,

          orden: ordenHabilitar,

          motivo: 'El secret PPPoE ya se encuentra habilitado en el router.',
        });
      } else {
        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenHabilitar,

          comandoSanitizado: `HABILITAR_SECRET usuario=${usuarioPppoe}`,

          ejecutar: async () => {
            const result = await session!.habilitarSecret({
              usuarioPppoe,
            });

            return {
              value: result,

              respuestaSanitizada: result.respuestaSanitizada,
            };
          },
        });

        comandoHabilitarEjecutado = true;
      }

      /*
       * ======================================================
       * 4. CONFIRMAR EL RESULTADO
       * ======================================================
       */

      const confirmationResult = await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenConfirmar,

        comandoSanitizado:
          `CONFIRMAR_SECRET usuario=${usuarioPppoe} ` +
          `perfil=${codigoPerfil} ` +
          'deshabilitado=false',

        ejecutar: async () => {
          const result = await session!.confirmarSecret({
            debeExistir: true,

            usuarioPppoe,

            codigoPerfilEsperado: codigoPerfil,

            deshabilitadoEsperado: false,
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

        habilitacionOmitida,

        comandoHabilitarEjecutado,

        secretConfirmado: confirmationResult.confirmado,

        perfilCoincide: secretConfirmado?.codigoPerfil === codigoPerfil,

        habilitado: secretConfirmado?.deshabilitado === false,
      };
    } finally {
      await this.closeSessionSafely(session);
    }
  }

  private validateContext(contexto: ContextoEjecucionPppoe): void {
    if (contexto.operacion.tipo !== TipoOperacionPppoe.ACTIVAR_SECRET) {
      throw new ConflictException(
        `ActivarSecretPppoeExecutor no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
      );
    }

    if (contexto.cuenta.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE debe estar persistida antes de activar el secret.',
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

    /**
     * ACTIVAR_SECRET no necesita descifrar
     * la contraseña PPPoE.
     */
    if (contexto.passwordPppoe !== null) {
      throw new ConflictException(
        'ACTIVAR_SECRET no debe contener la contraseña PPPoE descifrada.',
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

  /**
   * El cierre no sustituye el resultado funcional.
   *
   * El estado remoto ya debe haber sido confirmado
   * mediante CONFIRMAR_SECRET.
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
      /**
       * No propagamos errores secundarios de cierre.
       */
    }
  }
}
