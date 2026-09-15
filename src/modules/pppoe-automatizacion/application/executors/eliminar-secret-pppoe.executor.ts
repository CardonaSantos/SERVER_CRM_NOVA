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
 * Ejecuta la eliminación definitiva del acceso PPPoE.
 *
 * Operación técnica:
 *
 * ELIMINAR_SECRET
 *
 * Puede ser utilizada por distintos contextos
 * funcionales:
 *
 * - DESINSTALACION;
 * - BAJA_MANUAL.
 *
 * El executor no diferencia esos contextos.
 * Su única responsabilidad es alcanzar y confirmar
 * el estado remoto solicitado.
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

    /*
     * Antes de abrir SSH comprobamos que la operación
     * contiene exactamente el plan técnico soportado
     * actualmente para ELIMINAR_SECRET.
     *
     * Esto evita ejecutar operaciones antiguas o
     * inconsistentes con un orden diferente.
     */
    this.validatePlan(pasos);

    const operacionId = contexto.operacion.id;

    this.validateContext(contexto);

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
      /**
       * MikrotikSshSession realizará internamente:
       *
       * - consulta de sesiones antes;
       * - ejecución EXACTAMENTE UNA VEZ del comando remove;
       * - confirmación posterior mediante polling acotado;
       * - backoff entre comprobaciones cuando RouterOS todavía
       *   reporte una sesión activa;
       * - confirmación final de cero sesiones restantes.
       *
       * IMPORTANTE:
       *
       * Los reintentos posteriores al remove son únicamente
       * consultas de lectura.
       *
       * /ppp active remove [find name="..."]
       *
       * no se vuelve a ejecutar durante la misma operación.
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
       * El Estado 5 únicamente se considera confirmado cuando
       * una consulta posterior demuestra que el Secret ya no
       * existe.
       *
       * La ausencia de sesiones activas ya fue confirmada por
       * removerSesionActiva(), incluyendo su ventana acotada
       * de convergencia.
       *
       * Por tanto este paso no vuelve a consultar ni remover
       * sesiones; únicamente confirma:
       *
       * debeExistir = false
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

        /**
         * Propiedad conservada por compatibilidad con
         * resultados históricos.
         *
         * En v3 no existe un paso DESHABILITAR_SECRET
         * dentro del Estado 5.
         */
        deshabilitacionOmitida: true,

        /**
         * Los dos comandos modificadores definidos por
         * Estado 5 fueron ejecutados.
         */
        eliminacionOmitida: false,

        remocionSesionOmitida: false,

        comandoEliminarEjecutado: deleteResult.comandoEjecutado,

        /**
         * Si removerSesionActiva() retornó satisfactoriamente,
         * RouterOS aceptó el comando de remoción y posteriormente
         * se confirmó que ya no permanecen sesiones activas.
         */
        remocionSesionEjecutada: true,

        sesionesEncontradas: removeSessionResult.sesionesEncontradas,

        sesionesRemovidas: removeSessionResult.sesionesRemovidas,

        sesionesRestantes: removeSessionResult.sesionesRestantes,

        /**
         * Telemetría de convergencia de /ppp active.
         *
         * Permite conocer cuántas comprobaciones fueron necesarias
         * después del comando remove y cuánto tardó RouterOS en
         * reflejar el estado final.
         */
        confirmacionSesionIntentos: removeSessionResult.confirmacionIntentos,

        confirmacionSesionDuracionMs:
          removeSessionResult.confirmacionDuracionMs,

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
      /**
       * El módulo SSH ya realizó su intento de cierre.
       *
       * El posible efecto remoto de la operación se controla
       * mediante los pasos y confirmaciones anteriores.
       */
    }
  }

  /**
   * Valida que ELIMINAR_SECRET utilice exactamente
   * el plan técnico actualmente soportado.
   *
   * Orden obligatorio:
   *
   * 1. CONECTAR_ROUTER
   * 2. BUSCAR_SECRET
   * 3. ELIMINAR_SECRET
   * 4. REMOVER_SESION_ACTIVA
   * 5. CONFIRMAR_SECRET
   *
   * No se admite DESHABILITAR_SECRET.
   *
   * Esta regla aplica tanto a:
   *
   * - una desinstalación formal;
   * - una baja administrativa manual.
   *
   * El executor no necesita conocer cuál de los dos
   * contextos funcionales originó la operación.
   */
  private validatePlan(pasos: PppoeOperacionPasoEntity[]): void {
    const expectedPlan: TipoPasoPppoe[] = [
      TipoPasoPppoe.CONECTAR_ROUTER,
      TipoPasoPppoe.BUSCAR_SECRET,
      TipoPasoPppoe.ELIMINAR_SECRET,
      TipoPasoPppoe.REMOVER_SESION_ACTIVA,
      TipoPasoPppoe.CONFIRMAR_SECRET,
    ];

    const orderedSteps = [...pasos].sort(
      (left, right) => left.orden - right.orden,
    );

    if (orderedSteps.length !== expectedPlan.length) {
      throw new ConflictException(
        `ELIMINAR_SECRET requiere exactamente ${expectedPlan.length} pasos técnicos. Se recibieron ${orderedSteps.length}.`,
      );
    }

    expectedPlan.forEach((expectedType, index) => {
      const step = orderedSteps[index];

      if (step.orden !== index + 1) {
        throw new ConflictException(
          `El plan ELIMINAR_SECRET contiene un orden inválido en la posición ${index + 1}.`,
        );
      }

      if (step.tipo !== expectedType) {
        throw new ConflictException(
          `El plan ELIMINAR_SECRET esperaba ${expectedType} en el paso ${index + 1}, pero recibió ${step.tipo}.`,
        );
      }
    });
  }
}
