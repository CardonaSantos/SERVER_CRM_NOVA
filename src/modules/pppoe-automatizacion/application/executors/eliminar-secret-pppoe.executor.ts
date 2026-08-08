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
 * Ejecuta la baja definitiva PPPoE.
 *
 * Corresponde al Estado 5:
 *
 * "En Desinstalación"
 *
 * Flujo técnico:
 *
 * 1. CONECTAR_ROUTER
 * 2. BUSCAR_SECRET
 * 3. ELIMINAR_SECRET
 * 4. REMOVER_SESION_ACTIVA
 * 5. CONFIRMAR_SECRET
 *
 * Requerimiento PPPoE v3:
 *
 * /ppp secret remove [find name="{id_cliente}"]
 * /ppp active remove [find name="{id_cliente}"]
 *
 * IMPORTANTE:
 *
 * - no se deshabilita previamente el Secret;
 * - primero se elimina el Secret;
 * - después se elimina cualquier sesión activa;
 * - finalmente se confirma que el Secret ya no existe.
 *
 * Ambos comandos modificadores se ejecutan incluso cuando
 * la consulta previa no encuentra el Secret.
 *
 * Esto permite que un reintento continúe limpiando cualquier
 * sesión PPPoE que todavía pudiera existir.
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

    /*
     * Los órdenes pertenecen al agregado persistido.
     *
     * Para las nuevas operaciones ELIMINAR_SECRET,
     * PppoeOperacionPlanFactory debe producir:
     *
     * 1 CONECTAR_ROUTER
     * 2 BUSCAR_SECRET
     * 3 ELIMINAR_SECRET
     * 4 REMOVER_SESION_ACTIVA
     * 5 CONFIRMAR_SECRET
     */
    const ordenConectar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.CONECTAR_ROUTER,
    );

    const ordenBuscar = this.getStepOrder(pasos, TipoPasoPppoe.BUSCAR_SECRET);

    const ordenEliminar = this.getStepOrder(
      pasos,
      TipoPasoPppoe.ELIMINAR_SECRET,
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

    let secretEncontrado = false;

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
             * Configuración actual de infraestructura.
             *
             * La validación estricta del fingerprint
             * pertenece al módulo SSH.
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
       * 2. BUSCAR SECRET
       * ======================================================
       *
       * Consulta auxiliar previa.
       *
       * No sustituye ninguno de los comandos del Estado 5.
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
       * ======================================================
       * VALIDACIÓN DE SEGURIDAD
       * ======================================================
       *
       * Si existe un Secret con el mismo NAME pero su Profile
       * no coincide con la homologación de la cuenta, detenemos
       * la operación antes de ejecutar una eliminación.
       *
       * Esta comprobación no modifica la sintaxis del comando
       * auditado; es una validación previa de seguridad.
       */

      if (
        searchResult.encontrado &&
        searchResult.secret &&
        searchResult.secret.codigoPerfil !== codigoPerfil
      ) {
        await this.stepRunner.ejecutar({
          empresaId,

          operacionId,

          orden: ordenEliminar,

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
       * ======================================================
       * 3. ELIMINAR SECRET
       * ======================================================
       *
       * Primer comando auditado del Estado 5:
       *
       * /ppp secret remove [find name="{id_cliente}"]
       *
       * Se ejecuta también en un reintento donde BUSCAR_SECRET
       * ya no encuentre el registro.
       *
       * No existe un DESHABILITAR_SECRET previo.
       */

      const deleteResult = await this.stepRunner.ejecutar({
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

      /*
       * ======================================================
       * 4. REMOVER SESIONES ACTIVAS
       * ======================================================
       *
       * Segundo comando auditado del Estado 5:
       *
       * /ppp active remove [find name="{id_cliente}"]
       *
       * Debe ejecutarse DESPUÉS de eliminar el Secret.
       *
       * MikrotikSshSession realizará internamente:
       *
       * - consulta de sesiones antes;
       * - comando remove exacto;
       * - consulta de sesiones después;
       * - confirmación de cero sesiones restantes.
       */

      const removeSessionResult = await this.stepRunner.ejecutar({
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
       * ======================================================
       * 5. CONFIRMAR AUSENCIA DEL SECRET
       * ======================================================
       *
       * El Estado 5 únicamente se considera confirmado cuando
       * una consulta posterior demuestra que el Secret ya no
       * existe.
       *
       * La ausencia de sesiones activas ya fue confirmada por
       * removerSesionActiva().
       */

      const confirmationResult = await this.stepRunner.ejecutar({
        empresaId,

        operacionId,

        orden: ordenConfirmar,

        comandoSanitizado:
          `CONFIRMAR_SECRET usuario=${usuarioPppoe} ` + 'debeExistir=false',

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

        /*
         * Propiedad conservada por compatibilidad con
         * resultados históricos.
         *
         * En v3 la deshabilitación no se omite:
         * simplemente ya no forma parte del Estado 5.
         */
        deshabilitacionOmitida: true,

        /*
         * Los dos comandos definidos por Estado 5
         * fueron efectivamente ejecutados.
         */
        eliminacionOmitida: false,

        remocionSesionOmitida: false,

        comandoEliminarEjecutado: deleteResult.comandoEjecutado,

        remocionSesionEjecutada: true,

        sesionesEncontradas: removeSessionResult.sesionesEncontradas,

        sesionesRemovidas: removeSessionResult.sesionesRemovidas,

        sesionesRestantes: removeSessionResult.sesionesRestantes,

        secretEliminado: confirmationResult.confirmado,

        secretExisteDespues: confirmationResult.secretActual !== null,
      };
    } finally {
      await this.closeSessionSafely(session);
    }
  }

  /**
   * Valida el contexto antes de abrir SSH.
   */
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
     * ELIMINAR_SECRET no requiere conocer ni descifrar
     * la contraseña PPPoE.
     */
    if (contexto.passwordPppoe !== null) {
      throw new ConflictException(
        'ELIMINAR_SECRET no debe contener la contraseña PPPoE descifrada.',
      );
    }
  }

  /**
   * Recupera el orden del paso desde el agregado
   * persistido.
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
   * Garantiza que la sesión SSH quedó realmente
   * disponible después del paso CONECTAR_ROUTER.
   */
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
   * Un error secundario durante el cierre no sustituye
   * el resultado funcional de la operación.
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
       * El módulo SSH ya realizó su intento de cierre.
       *
       * El posible efecto remoto de la operación se controla
       * mediante los pasos y confirmaciones anteriores.
       */
    }
  }
}

// import { ConflictException, Inject, Injectable } from '@nestjs/common';

// import {
//   CodigoErrorMikrotikSsh,
//   EfectoRemotoMikrotik,
//   FaseFalloMikrotikSsh,
//   MetodoAutenticacionMikrotikSsh,
// } from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

// import {
//   MIKROTIK_SSH_PORT,
//   MikrotikSshPort,
// } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';

// import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';

// import { PppoeOperacionPasoEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion-paso.entity';

// import {
//   TipoOperacionPppoe,
//   TipoPasoPppoe,
// } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

// import { PppoeOperacionResultado } from 'src/modules/pppoe-operacion/domain/props/pppoe-operacion.props';

// import { PppoeOperacionStepError } from '../errors/pppoe-operacion-step.error';

// import { ContextoEjecucionPppoe } from '../models/contexto-ejecucion-pppoe.model';

// import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';

// export type EjecutarEliminarSecretPppoeParams = {
//   contexto: ContextoEjecucionPppoe;

//   pasos: PppoeOperacionPasoEntity[];
// };

// /**
//  * Elimina definitivamente un secret PPPoE.
//  *
//  * Flujo:
//  *
//  * 1. conectar;
//  * 2. buscar;
//  * 3. deshabilitar;
//  * 4. remover sesiones;
//  * 5. eliminar;
//  * 6. confirmar que ya no existe.
//  *
//  * Cuando el secret ya no existe, los pasos modificadores
//  * se omiten y la confirmación final continúa.
//  */
// @Injectable()
// export class EliminarSecretPppoeExecutor {
//   constructor(
//     @Inject(MIKROTIK_SSH_PORT)
//     private readonly mikrotikSsh: MikrotikSshPort,

//     private readonly stepRunner: PppoeOperacionStepRunnerService,
//   ) {}

//   async execute(
//     params: EjecutarEliminarSecretPppoeParams,
//   ): Promise<PppoeOperacionResultado> {
//     const { contexto, pasos } = params;

//     this.validateContext(contexto);

//     const operacionId = contexto.operacion.id;

//     if (operacionId === null) {
//       throw new ConflictException(
//         'La operación PPPoE debe estar persistida antes de ejecutarse.',
//       );
//     }

//     const empresaId = contexto.operacion.empresaId;

//     const usuarioPppoe = contexto.cuenta.usuario;

//     const codigoPerfil = contexto.perfil.codigoPerfil;

//     const ordenConectar = this.getStepOrder(
//       pasos,
//       TipoPasoPppoe.CONECTAR_ROUTER,
//     );

//     const ordenBuscar = this.getStepOrder(pasos, TipoPasoPppoe.BUSCAR_SECRET);

//     const ordenDeshabilitar = this.getStepOrder(
//       pasos,
//       TipoPasoPppoe.DESHABILITAR_SECRET,
//     );

//     const ordenRemoverSesion = this.getStepOrder(
//       pasos,
//       TipoPasoPppoe.REMOVER_SESION_ACTIVA,
//     );

//     const ordenEliminar = this.getStepOrder(
//       pasos,
//       TipoPasoPppoe.ELIMINAR_SECRET,
//     );

//     const ordenConfirmar = this.getStepOrder(
//       pasos,
//       TipoPasoPppoe.CONFIRMAR_SECRET,
//     );

//     let session: MikrotikSshSessionPort | null = null;

//     let secretEncontrado = false;

//     let deshabilitacionOmitida = false;

//     let remocionSesionOmitida = false;

//     let eliminacionOmitida = false;

//     try {
//       /*
//        * ======================================================
//        * 1. CONECTAR AL ROUTER
//        * ======================================================
//        */

//       await this.stepRunner.ejecutar({
//         empresaId,

//         operacionId,

//         orden: ordenConectar,

//         comandoSanitizado:
//           `CONECTAR_ROUTER host=${contexto.router.host} ` +
//           `port=${contexto.router.port} ` +
//           `username=${contexto.router.username}`,

//         ejecutar: async () => {
//           session = await this.mikrotikSsh.abrirSesion({
//             host: contexto.router.host,

//             port: contexto.router.port,

//             username: contexto.router.username,

//             autenticacion: {
//               metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

//               password: contexto.router.password,
//             },

//             verificacionHost: {
//               verificar: false,
//             },
//           });

//           const info = session.obtenerInfo();

//           return {
//             value: true,

//             respuestaSanitizada: `Sesión SSH abierta contra ${info.host}:${info.port}.`,
//           };
//         },
//       });

//       const activeSession = this.requireOpenSession(session);

//       /*
//        * ======================================================
//        * 2. BUSCAR SECRET
//        * ======================================================
//        */

//       const searchResult = await this.stepRunner.ejecutar({
//         empresaId,

//         operacionId,

//         orden: ordenBuscar,

//         comandoSanitizado: `BUSCAR_SECRET usuario=${usuarioPppoe}`,

//         ejecutar: async () => {
//           const result = await activeSession.buscarSecret({
//             usuarioPppoe,
//           });

//           return {
//             value: result,

//             respuestaSanitizada: result.respuestaSanitizada,
//           };
//         },
//       });

//       secretEncontrado =
//         searchResult.encontrado && searchResult.secret !== null;

//       /*
//        * El estado remoto deseado ya se cumple.
//        *
//        * No se considera error que el secret haya sido
//        * eliminado anteriormente.
//        */
//       if (!searchResult.encontrado || !searchResult.secret) {
//         deshabilitacionOmitida = true;

//         remocionSesionOmitida = true;

//         eliminacionOmitida = true;

//         await this.stepRunner.omitir({
//           empresaId,

//           operacionId,

//           orden: ordenDeshabilitar,

//           motivo: 'El secret PPPoE no existe en el router.',
//         });

//         await this.stepRunner.omitir({
//           empresaId,

//           operacionId,

//           orden: ordenRemoverSesion,

//           motivo: 'No existe un secret PPPoE asociado a sesiones activas.',
//         });

//         await this.stepRunner.omitir({
//           empresaId,

//           operacionId,

//           orden: ordenEliminar,

//           motivo: 'El secret PPPoE ya se encuentra eliminado.',
//         });
//       } else {
//         const secret = searchResult.secret;

//         /*
//          * Evita eliminar un secret que conserve el mismo
//          * usuario, pero pertenezca a otro perfil.
//          */
//         if (secret.codigoPerfil !== codigoPerfil) {
//           await this.stepRunner.ejecutar({
//             empresaId,

//             operacionId,

//             orden: ordenDeshabilitar,

//             comandoSanitizado: `VALIDAR_PERFIL_SECRET usuario=${usuarioPppoe}`,

//             ejecutar: async () => {
//               throw new PppoeOperacionStepError({
//                 errorCodigo: CodigoErrorMikrotikSsh.PERFIL_NO_COINCIDE,

//                 errorMensaje:
//                   'El perfil del secret remoto no coincide con la homologación asignada.',

//                 efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

//                 reintentable: false,

//                 fase: FaseFalloMikrotikSsh.EJECUCION,
//               });
//             },
//           });

//           throw new Error(
//             'Flujo inesperado después de registrar PERFIL_NO_COINCIDE.',
//           );
//         }

//         /*
//          * ====================================================
//          * 3. DESHABILITAR SECRET
//          * ====================================================
//          */

//         if (secret.deshabilitado) {
//           deshabilitacionOmitida = true;

//           await this.stepRunner.omitir({
//             empresaId,

//             operacionId,

//             orden: ordenDeshabilitar,

//             motivo: 'El secret PPPoE ya se encuentra deshabilitado.',
//           });
//         } else {
//           await this.stepRunner.ejecutar({
//             empresaId,

//             operacionId,

//             orden: ordenDeshabilitar,

//             comandoSanitizado: `DESHABILITAR_SECRET usuario=${usuarioPppoe}`,

//             ejecutar: async () => {
//               const result = await activeSession.deshabilitarSecret({
//                 usuarioPppoe,
//               });

//               return {
//                 value: result,

//                 respuestaSanitizada: result.respuestaSanitizada,
//               };
//             },
//           });
//         }

//         /*
//          * ====================================================
//          * 4. REMOVER SESIONES ACTIVAS
//          * ====================================================
//          */

//         await this.stepRunner.ejecutar({
//           empresaId,

//           operacionId,

//           orden: ordenRemoverSesion,

//           comandoSanitizado: `REMOVER_SESION_ACTIVA usuario=${usuarioPppoe}`,

//           ejecutar: async () => {
//             const result = await activeSession.removerSesionActiva({
//               usuarioPppoe,
//             });

//             return {
//               value: result,

//               respuestaSanitizada: result.respuestaSanitizada,
//             };
//           },
//         });

//         /*
//          * ====================================================
//          * 5. ELIMINAR SECRET
//          * ====================================================
//          */

//         await this.stepRunner.ejecutar({
//           empresaId,

//           operacionId,

//           orden: ordenEliminar,

//           comandoSanitizado: `ELIMINAR_SECRET usuario=${usuarioPppoe}`,

//           ejecutar: async () => {
//             const result = await activeSession.eliminarSecret({
//               usuarioPppoe,
//             });

//             return {
//               value: result,

//               respuestaSanitizada: result.respuestaSanitizada,
//             };
//           },
//         });
//       }

//       /*
//        * ======================================================
//        * 6. CONFIRMAR AUSENCIA
//        * ======================================================
//        */

//       const confirmationResult = await this.stepRunner.ejecutar({
//         empresaId,

//         operacionId,

//         orden: ordenConfirmar,

//         comandoSanitizado: `CONFIRMAR_SECRET usuario=${usuarioPppoe} debeExistir=false`,

//         ejecutar: async () => {
//           const result = await activeSession.confirmarSecret({
//             usuarioPppoe,

//             debeExistir: false,
//           });

//           return {
//             value: result,

//             respuestaSanitizada: result.respuestaSanitizada,
//           };
//         },
//       });

//       return {
//         secretEncontrado,

//         deshabilitacionOmitida,

//         remocionSesionOmitida,

//         eliminacionOmitida,

//         secretEliminado: confirmationResult.confirmado,

//         secretExisteDespues: confirmationResult.secretActual !== null,
//       };
//     } finally {
//       await this.closeSessionSafely(session);
//     }
//   }

//   private validateContext(contexto: ContextoEjecucionPppoe): void {
//     if (contexto.operacion.tipo !== TipoOperacionPppoe.ELIMINAR_SECRET) {
//       throw new ConflictException(
//         `EliminarSecretPppoeExecutor no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
//       );
//     }

//     if (contexto.cuenta.id === null) {
//       throw new ConflictException(
//         'La cuenta PPPoE debe estar persistida antes de eliminar el secret.',
//       );
//     }

//     if (contexto.cuenta.empresaId !== contexto.operacion.empresaId) {
//       throw new ConflictException(
//         'La cuenta PPPoE y la operación pertenecen a empresas diferentes.',
//       );
//     }

//     /*
//      * ELIMINAR_SECRET no necesita descifrar
//      * la contraseña PPPoE.
//      */
//     if (contexto.passwordPppoe !== null) {
//       throw new ConflictException(
//         'ELIMINAR_SECRET no debe contener la contraseña PPPoE descifrada.',
//       );
//     }
//   }

//   private getStepOrder(
//     pasos: PppoeOperacionPasoEntity[],
//     tipo: TipoPasoPppoe,
//   ): number {
//     const matches = pasos.filter((paso) => paso.tipo === tipo);

//     if (matches.length === 0) {
//       throw new ConflictException(`La operación no contiene el paso ${tipo}.`);
//     }

//     if (matches.length > 1) {
//       throw new ConflictException(
//         `La operación contiene más de un paso ${tipo}.`,
//       );
//     }

//     return matches[0].orden;
//   }

//   private requireOpenSession(
//     session: MikrotikSshSessionPort | null,
//   ): MikrotikSshSessionPort {
//     if (!session || !session.estaAbierta()) {
//       throw new ConflictException(
//         'La sesión SSH no quedó disponible después de la conexión.',
//       );
//     }

//     return session;
//   }

//   private async closeSessionSafely(
//     session: MikrotikSshSessionPort | null,
//   ): Promise<void> {
//     if (!session) {
//       return;
//     }

//     try {
//       await session.cerrar();
//     } catch {
//       /*
//        * El fallo secundario de cierre no sustituye
//        * el resultado funcional de la operación.
//        */
//     }
//   }
// }
