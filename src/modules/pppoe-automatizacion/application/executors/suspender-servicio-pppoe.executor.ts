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
 * Ejecuta el plan técnico de SUSPENDER_SERVICIO.
 *
 * Corresponde al Estado 4:
 *
 * "En Suspendido" / Corte de Servicio
 *
 * Flujo:
 *
 * 1. CONECTAR_ROUTER
 * 2. BUSCAR_SECRET
 * 3. DESHABILITAR_SECRET
 * 4. REMOVER_SESION_ACTIVA
 * 5. CONFIRMAR_SECRET
 *
 * Requerimiento PPPoE v3:
 *
 * /ppp secret disable [find name="{id_cliente}"]
 * /ppp active remove [find name="{id_cliente}"]
 *
 * Ambos comandos se ejecutan secuencialmente sobre
 * la misma sesión SSH.
 *
 * La consulta previa se utiliza únicamente para comprobar
 * que el Secret esperado existe en RouterOS.
 *
 * No se utiliza para omitir DESHABILITAR_SECRET.
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

    /*
     * Los órdenes se obtienen del agregado persistido.
     *
     * El executor no depende de números escritos
     * manualmente.
     */
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
             * La verificación estricta de fingerprint
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
       * 2. BUSCAR EL SECRET
       * ======================================================
       *
       * Esta consulta es auxiliar.
       *
       * No reemplaza ninguno de los comandos de suspensión.
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
       * VALIDAR EXISTENCIA
       * ======================================================
       *
       * El CRM esperaba que la cuenta tuviera un Secret
       * previamente creado.
       *
       * Si no existe, existe una inconsistencia entre
       * nuestro estado local y RouterOS.
       */

      if (!searchResult.encontrado || !searchResult.secret) {
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

        /*
         * El runner propaga siempre la excepción.
         *
         * Este throw protege únicamente contra un
         * comportamiento inesperado.
         */
        throw new Error(
          'Flujo inesperado después de registrar SECRET_NO_ENCONTRADO.',
        );
      }

      /*
       * ======================================================
       * 3. DESHABILITAR SECRET
       * ======================================================
       *
       * Primer comando del Estado 4:
       *
       * /ppp secret disable [find name="{id_cliente}"]
       *
       * IMPORTANTE:
       *
       * Se ejecuta incluso cuando la consulta anterior
       * indicó que disabled=true.
       *
       * No se sustituye el comando del cambio de estado
       * por una inferencia basada en la consulta previa.
       */

      const disableResult = await this.stepRunner.ejecutar({
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

      /*
       * ======================================================
       * 4. REMOVER SESIÓN ACTIVA
       * ======================================================
       *
       * Segundo comando del Estado 4:
       *
       * /ppp active remove [find name="{id_cliente}"]
       *
       * Este paso se ejecuta siempre después de disable.
       *
       * MikrotikSshSession se encarga internamente de:
       *
       * - consultar sesiones antes;
       * - ejecutar el comando exacto;
       * - consultar sesiones después;
       * - confirmar que no quedan conexiones activas.
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
       * 5. CONFIRMAR SUSPENSIÓN
       * ======================================================
       *
       * Comprobamos finalmente que:
       *
       * - el Secret continúa existiendo;
       * - disabled=true.
       *
       * La ausencia de sesiones activas ya fue confirmada
       * dentro de removerSesionActiva().
       *
       * No exigimos que el Profile coincida para permitir
       * el corte de un servicio cuya configuración remota
       * pudiera tener una inconsistencia de homologación.
       *
       * El Profile observado se conserva en el resultado.
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

        /*
         * Se conserva para compatibilidad con resultados
         * históricos.
         *
         * En el flujo v3 siempre será false porque el
         * comando disable ya no se omite.
         */
        deshabilitacionOmitida: false,

        comandoDeshabilitarEjecutado: disableResult.comandoEjecutado,

        /*
         * removerSesionActiva() no retorna simplemente
         * "comando ejecutado": retorna el estado confirmado
         * antes/después.
         *
         * Si llegamos aquí, el paso fue ejecutado y
         * confirmado satisfactoriamente.
         */
        remocionSesionEjecutada: true,

        sesionesEncontradas: removeSessionResult.sesionesEncontradas,

        sesionesRemovidas: removeSessionResult.sesionesRemovidas,

        sesionesRestantes: removeSessionResult.sesionesRestantes,

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

    /*
     * El Estado 4 presupone que existe previamente
     * un Secret creado en RouterOS.
     */
    if (!contexto.cuenta.tieneSecretCreado) {
      throw new ConflictException(
        'La cuenta PPPoE no tiene confirmado un secret creado.',
      );
    }

    /*
     * La suspensión aplica sobre un servicio que
     * anteriormente fue activado.
     */
    if (!contexto.cuenta.activadoEn) {
      throw new ConflictException(
        'La cuenta PPPoE nunca fue activada y no puede suspenderse.',
      );
    }

    /*
     * SUSPENDER_SERVICIO no necesita descifrar
     * la contraseña PPPoE.
     */
    if (contexto.passwordPppoe !== null) {
      throw new ConflictException(
        'SUSPENDER_SERVICIO no debe contener la contraseña PPPoE descifrada.',
      );
    }
  }

  /**
   * Obtiene el orden real de un paso dentro
   * del agregado persistido.
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
   * Devuelve una sesión garantizada como abierta.
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
   * El fallo de cierre no sustituye el resultado
   * funcional de la operación.
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
       * No propagamos errores secundarios
       * producidos durante el cierre.
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

// export type EjecutarSuspenderServicioPppoeParams = {
//   contexto: ContextoEjecucionPppoe;

//   pasos: PppoeOperacionPasoEntity[];
// };

// /**
//  * Ejecuta el plan técnico de SUSPENDER_SERVICIO:
//  *
//  * 1. CONECTAR_ROUTER
//  * 2. BUSCAR_SECRET
//  * 3. DESHABILITAR_SECRET u OMITIR
//  * 4. REMOVER_SESION_ACTIVA
//  * 5. CONFIRMAR_SECRET
//  *
//  * La sesión activa se elimina aunque el secret ya estuviera
//  * deshabilitado, porque el cliente podría conservar una
//  * conexión PPPoE establecida previamente.
//  */
// @Injectable()
// export class SuspenderServicioPppoeExecutor {
//   constructor(
//     @Inject(MIKROTIK_SSH_PORT)
//     private readonly mikrotikSsh: MikrotikSshPort,

//     private readonly stepRunner: PppoeOperacionStepRunnerService,
//   ) {}

//   async execute(
//     params: EjecutarSuspenderServicioPppoeParams,
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

//     const perfilProps = contexto.perfil.toPrimitives();

//     const codigoPerfil = perfilProps.codigoPerfil;

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

//     const ordenConfirmar = this.getStepOrder(
//       pasos,
//       TipoPasoPppoe.CONFIRMAR_SECRET,
//     );

//     let session: MikrotikSshSessionPort | null = null;

//     let deshabilitacionOmitida = false;

//     let comandoDeshabilitarEjecutado = false;

//     let remocionSesionEjecutada = false;

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

//             /*
//              * Integración inicial.
//              *
//              * Posteriormente se sustituirá por la
//              * verificación estricta de fingerprint.
//              */
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
//        * 2. BUSCAR EL SECRET
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

//       /*
//        * ======================================================
//        * 3. DESHABILITAR U OMITIR
//        * ======================================================
//        */

//       if (!searchResult.encontrado || !searchResult.secret) {
//         /*
//          * No marcamos la cuenta como suspendida cuando el
//          * secret desapareció del router.
//          *
//          * Ese caso representa una inconsistencia que debe
//          * revisarse antes de sincronizar el estado local.
//          */
//         await this.stepRunner.ejecutar({
//           empresaId,

//           operacionId,

//           orden: ordenDeshabilitar,

//           comandoSanitizado: `DESHABILITAR_SECRET usuario=${usuarioPppoe}`,

//           ejecutar: async () => {
//             throw new PppoeOperacionStepError({
//               errorCodigo: CodigoErrorMikrotikSsh.SECRET_NO_ENCONTRADO,

//               errorMensaje: `No existe el secret PPPoE ${usuarioPppoe} en el router.`,

//               efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

//               reintentable: true,

//               fase: FaseFalloMikrotikSsh.EJECUCION,
//             });
//           },
//         });

//         throw new Error(
//           'Flujo inesperado después de registrar SECRET_NO_ENCONTRADO.',
//         );
//       }

//       const secretEncontrado = searchResult.secret;

//       if (secretEncontrado.deshabilitado) {
//         deshabilitacionOmitida = true;

//         await this.stepRunner.omitir({
//           empresaId,

//           operacionId,

//           orden: ordenDeshabilitar,

//           motivo: 'El secret PPPoE ya se encuentra deshabilitado en el router.',
//         });
//       } else {
//         await this.stepRunner.ejecutar({
//           empresaId,

//           operacionId,

//           orden: ordenDeshabilitar,

//           comandoSanitizado: `DESHABILITAR_SECRET usuario=${usuarioPppoe}`,

//           ejecutar: async () => {
//             const result = await activeSession.deshabilitarSecret({
//               usuarioPppoe,
//             });

//             return {
//               value: result,

//               respuestaSanitizada: result.respuestaSanitizada,
//             };
//           },
//         });

//         comandoDeshabilitarEjecutado = true;
//       }

//       /*
//        * ======================================================
//        * 4. REMOVER SESIÓN ACTIVA
//        * ======================================================
//        *
//        * Es una acción idempotente.
//        *
//        * Si el cliente no tiene una sesión activa, el método
//        * debe devolver éxito con cero sesiones eliminadas.
//        */

//       await this.stepRunner.ejecutar({
//         empresaId,

//         operacionId,

//         orden: ordenRemoverSesion,

//         comandoSanitizado: `REMOVER_SESION_ACTIVA usuario=${usuarioPppoe}`,

//         ejecutar: async () => {
//           const result = await activeSession.removerSesionActiva({
//             usuarioPppoe,
//           });

//           return {
//             value: result,

//             respuestaSanitizada: result.respuestaSanitizada,
//           };
//         },
//       });

//       remocionSesionEjecutada = true;

//       /*
//        * ======================================================
//        * 5. CONFIRMAR SUSPENSIÓN
//        * ======================================================
//        *
//        * El objetivo de esta operación es comprobar que:
//        *
//        * - el secret continúa existiendo;
//        * - el secret quedó deshabilitado.
//        *
//        * El perfil se informa en el resultado, pero una
//        * diferencia de perfil no impide suspender el acceso.
//        */

//       const confirmationResult = await this.stepRunner.ejecutar({
//         empresaId,

//         operacionId,

//         orden: ordenConfirmar,

//         comandoSanitizado:
//           `CONFIRMAR_SECRET usuario=${usuarioPppoe} ` + 'deshabilitado=true',

//         ejecutar: async () => {
//           const result = await activeSession.confirmarSecret({
//             debeExistir: true,

//             usuarioPppoe,

//             deshabilitadoEsperado: true,
//           });

//           return {
//             value: result,

//             respuestaSanitizada: result.respuestaSanitizada,
//           };
//         },
//       });

//       const secretConfirmado = confirmationResult.secretActual;

//       return {
//         secretEncontrado: true,

//         deshabilitacionOmitida,

//         comandoDeshabilitarEjecutado,

//         remocionSesionEjecutada,

//         secretConfirmado: confirmationResult.confirmado,

//         deshabilitado: secretConfirmado?.deshabilitado === true,

//         perfilCoincide: secretConfirmado?.codigoPerfil === codigoPerfil,
//       };
//     } finally {
//       await this.closeSessionSafely(session);
//     }
//   }

//   /**
//    * Valida el contexto antes de abrir SSH.
//    */
//   private validateContext(contexto: ContextoEjecucionPppoe): void {
//     if (contexto.operacion.tipo !== TipoOperacionPppoe.SUSPENDER_SERVICIO) {
//       throw new ConflictException(
//         `SuspenderServicioPppoeExecutor no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
//       );
//     }

//     if (contexto.cuenta.id === null) {
//       throw new ConflictException(
//         'La cuenta PPPoE debe estar persistida antes de suspender el servicio.',
//       );
//     }

//     if (contexto.cuenta.empresaId !== contexto.operacion.empresaId) {
//       throw new ConflictException(
//         'La cuenta PPPoE y la operación pertenecen a empresas diferentes.',
//       );
//     }

//     if (!contexto.cuenta.tieneSecretCreado) {
//       throw new ConflictException(
//         'La cuenta PPPoE no tiene confirmado un secret creado.',
//       );
//     }

//     if (!contexto.cuenta.activadoEn) {
//       throw new ConflictException(
//         'La cuenta PPPoE nunca fue activada y no puede suspenderse.',
//       );
//     }

//     /*
//      * SUSPENDER_SERVICIO no necesita descifrar
//      * la contraseña de la cuenta PPPoE.
//      */
//     if (contexto.passwordPppoe !== null) {
//       throw new ConflictException(
//         'SUSPENDER_SERVICIO no debe contener la contraseña PPPoE descifrada.',
//       );
//     }
//   }

//   /**
//    * Obtiene el orden real del paso.
//    *
//    * Evita depender de números escritos manualmente.
//    */
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

//   /**
//    * El fallo de cierre no sustituye el resultado funcional
//    * de la operación.
//    */
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
//        * No propagamos errores secundarios del cierre.
//        */
//     }
//   }
// }
