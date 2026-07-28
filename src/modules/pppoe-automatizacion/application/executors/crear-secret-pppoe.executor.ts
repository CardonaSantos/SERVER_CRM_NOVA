import { ConflictException, Inject, Injectable } from '@nestjs/common';

import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';

import { MetodoAutenticacionMikrotikSsh } from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

import { PppoeOperacionPasoEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion-paso.entity';

import {
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { PppoeOperacionResultado } from 'src/modules/pppoe-operacion/domain/props/pppoe-operacion.props';

import { ContextoEjecucionPppoe } from '../models/contexto-ejecucion-pppoe.model';

import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';

export type EjecutarCrearSecretPppoeParams = {
  contexto: ContextoEjecucionPppoe;

  /**
   * Pasos pertenecientes al agregado de la operación.
   *
   * Se utilizan para resolver el orden real y evitar
   * depender de números escritos manualmente.
   */
  pasos: PppoeOperacionPasoEntity[];
};

/**
 * Ejecuta el plan técnico de CREAR_SECRET:
 *
 * 1. CONECTAR_ROUTER
 * 2. BUSCAR_SECRET
 * 3. AGREGAR_SECRET u OMITIR
 * 4. CONFIRMAR_SECRET
 *
 * Utiliza una única sesión SSH durante todo el flujo.
 */
@Injectable()
export class CrearSecretPppoeExecutor {
  constructor(
    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,

    private readonly stepRunner: PppoeOperacionStepRunnerService,
  ) {}

  async execute(
    params: EjecutarCrearSecretPppoeParams,
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

    const passwordPppoe = contexto.passwordPppoe;

    if (passwordPppoe === null) {
      throw new ConflictException(
        'La ejecución de CREAR_SECRET requiere la contraseña PPPoE temporal.',
      );
    }

    const perfilProps = contexto.perfil.toPrimitives();

    const codigoPerfil = perfilProps.codigoPerfil;

    const ordenConectar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONECTAR_ROUTER,
    );

    const ordenBuscar = this.getStepOrder(pasos, TipoPasoPppoe.BUSCAR_SECRET);

    const ordenAgregar = this.getStepOrder(pasos, TipoPasoPppoe.AGREGAR_SECRET);

    const ordenConfirmar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONFIRMAR_SECRET,
    );

    let session: MikrotikSshSessionPort | null = null;

    let secretEncontrado = false;

    let secretCreado = false;

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
          /*
           * Asignamos la sesión a la variable externa antes
           * de devolverla.
           *
           * Así podremos cerrarla incluso si posteriormente
           * falla la persistencia del resultado del paso.
           */
          session = await this.mikrotikSsh.abrirSesion({
            host: contexto.router.host,

            port: contexto.router.port,

            username: contexto.router.username,

            autenticacion: {
              metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

              password: contexto.router.password,
            },

            /*
             * Primera integración.
             *
             * Antes de producción se reemplazará por
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

      secretEncontrado = searchResult.encontrado;

      /*
       * ======================================================
       * 3. CREAR U OMITIR
       * ======================================================
       */

      if (searchResult.encontrado) {
        await this.stepRunner.omitir({
          empresaId,
          operacionId,
          orden: ordenAgregar,

          motivo:
            'El secret PPPoE ya existe en el router. Se comprobará su configuración actual.',
        });
      } else {
        await this.stepRunner.ejecutar({
          empresaId,
          operacionId,
          orden: ordenAgregar,

          /*
           * No se incluye passwordPppoe.
           */
          comandoSanitizado:
            `AGREGAR_SECRET usuario=${usuarioPppoe} ` +
            `perfil=${codigoPerfil} ` +
            'deshabilitado=true',

          ejecutar: async () => {
            const result = await session!.crearSecret({
              usuarioPppoe,

              passwordPppoe,

              codigoPerfil,

              /*
               * El secret se crea deshabilitado.
               *
               * La activación ocurrirá cuando la
               * instalación física se complete.
               */
              deshabilitado: true,

              comentario: `NOVA cuenta PPPoE ${contexto.cuenta.id}`,
            });

            return {
              value: result,

              respuestaSanitizada: result.respuestaSanitizada,
            };
          },
        });

        secretCreado = true;
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
          'deshabilitado=true',

        ejecutar: async () => {
          const result = await session!.confirmarSecret({
            debeExistir: true,

            usuarioPppoe,

            codigoPerfilEsperado: codigoPerfil,

            deshabilitadoEsperado: true,
          });

          return {
            value: result,

            respuestaSanitizada: result.respuestaSanitizada,
          };
        },
      });

      const secretActual = confirmationResult.secretActual;

      return {
        secretEncontrado,

        secretCreado,

        secretConfirmado: confirmationResult.confirmado,

        perfilCoincide: secretActual?.codigoPerfil === codigoPerfil,

        deshabilitado: secretActual?.deshabilitado ?? null,
      };
    } finally {
      await this.closeSessionSafely(session);
    }
  }

  private validateContext(contexto: ContextoEjecucionPppoe): void {
    if (contexto.operacion.tipo !== TipoOperacionPppoe.CREAR_SECRET) {
      throw new ConflictException(
        `CrearSecretPppoeExecutor no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
      );
    }

    if (contexto.cuenta.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE debe estar persistida antes de crear el secret.',
      );
    }

    if (contexto.cuenta.empresaId !== contexto.operacion.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE y la operación pertenecen a empresas diferentes.',
      );
    }
  }

  /**
   * Obtiene el orden real de un paso dentro del agregado.
   *
   * No dependemos de valores como 1, 2, 3 o 4 escritos
   * directamente en el ejecutor.
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

  /**
   * El cierre no cambia el resultado funcional después
   * de que el estado remoto ya fue confirmado.
   *
   * También evita sustituir un error técnico anterior por
   * un error secundario de cierre.
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
       * El módulo SSH ya intenta cerrar la conexión.
       *
       * No propagamos este error porque no existe un paso
       * de negocio CERRAR_SESION y el cambio remoto pudo
       * haber sido confirmado correctamente.
       */
    }
  }
}
