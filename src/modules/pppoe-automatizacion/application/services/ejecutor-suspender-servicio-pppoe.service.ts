import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
  MetodoAutenticacionMikrotikSsh,
} from 'src/modules/mikrotik-ssh/public/mikrotik-ssh.types';

import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/public/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/public/mikrotik-ssh-session.port';

import {
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { PppoeOperacionStepError } from '../../domain/errors/pppoe-automatizacion.errors';

import { ContextoEjecucionPppoe } from './resolver-contexto-ejecucion-pppoe.service';

import { PppoeOperacionStepRunnerService } from './pppoe-operacion-step-runner.service';
import {
  PppoeOperacionPasoReadModel,
  PppoeOperacionResultado,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import { ProvisionamientoPppoeEstadoInvalidoError } from '../../domain/errors/pppoe-automatizacion.errors';

export type EjecutarSuspenderServicioPppoeParams = {
  contexto: ContextoEjecucionPppoe;

  pasos: PppoeOperacionPasoReadModel[];
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
export class EjecutorSuspenderServicioPppoeService {
  private readonly logger = new Logger(
    EjecutorSuspenderServicioPppoeService.name,
  );
  constructor(
    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,
    private readonly stepRunner: PppoeOperacionStepRunnerService,
  ) {}

  async execute(
    params: EjecutarSuspenderServicioPppoeParams,
  ): Promise<PppoeOperacionResultado> {
    const { contexto, pasos } = params;

    this.logger.log(
      [
        '[SUSPENSION] Inicio executor',
        `operacionId=${contexto.operacion.id ?? 'null'}`,
        `cuentaId=${contexto.cuenta.id ?? 'null'}`,
        `usuario=${contexto.cuenta.usuario}`,
        `estado=${contexto.cuenta.estado}`,
        `activadoEn=${contexto.cuenta.activadoEn?.toISOString() ?? 'null'}`,
        `adoptadoEn=${contexto.cuenta.adoptadoEn?.toISOString() ?? 'null'}`,
        `esAdoptada=${contexto.cuenta.esAdoptada}`,
        `tieneSecret=${contexto.cuenta.tieneSecretCreado}`,
      ].join(' | '),
    );

    this.validateContext(contexto);
    this.logger.log(
      `[SUSPENSION] Contexto válido. Se continuará hacia SSH. usuario=${contexto.cuenta.usuario}`,
    );

    const operacionId = contexto.operacion.id;

    if (operacionId === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE debe estar persistida antes de ejecutarse.',
      );
    }

    const empresaId = contexto.operacion.empresaId;

    const usuarioPppoe = contexto.cuenta.usuario;

    const perfilProps = contexto.perfil;

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
      this.logger.log(
        `[SUSPENSION] Abriendo SSH router=${contexto.router.host}:${contexto.router.port} usuarioPppoe=${usuarioPppoe}`,
      );

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

      /**
       * MikrotikSshSession se encarga internamente de:
       *
       * - consultar sesiones antes;
       * - ejecutar exactamente una vez el comando de remoción;
       * - realizar confirmaciones posteriores mediante polling
       *   acotado con backoff;
       * - devolver únicamente cuando no quedan sesiones activas
       *   o lanzar SESION_NO_CONFIRMADA después de agotar la
       *   ventana de confirmación.
       *
       * Las comprobaciones posteriores son exclusivamente
       * consultas de lectura. El comando remove no se reenvía.
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
      /**
       * La ausencia de sesiones activas ya fue confirmada
       * dentro de removerSesionActiva(), incluyendo su ventana
       * acotada de convergencia.
       *
       * Este paso únicamente confirma ahora el estado final
       * del Secret:
       *
       * - debe continuar existiendo;
       * - debe encontrarse disabled=true.
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
        /**
         * Se conserva para compatibilidad con resultados históricos.
         *
         * En el flujo v3 la deshabilitación nunca se omite:
         * el comando /ppp secret disable se ejecuta explícitamente.
         */
        deshabilitacionOmitida: false,
        comandoDeshabilitarEjecutado: disableResult.comandoEjecutado,
        /**
         * Si llegamos hasta este punto significa que
         * removerSesionActiva() terminó satisfactoriamente.
         *
         * Es decir:
         *
         * - RouterOS aceptó el comando remove;
         * - la confirmación posterior terminó con cero sesiones.
         */
        remocionSesionEjecutada: true,
        sesionesEncontradas: removeSessionResult.sesionesEncontradas,
        sesionesRemovidas: removeSessionResult.sesionesRemovidas,
        sesionesRestantes: removeSessionResult.sesionesRestantes,
        /**
         * Telemetría de convergencia.
         *
         * Permite conocer cuántas consultas posteriores al remove
         * fueron necesarias antes de que RouterOS dejara de reportar
         * la sesión PPPoE.
         */
        confirmacionSesionIntentos: removeSessionResult.confirmacionIntentos,
        /**
         * Tiempo total dedicado a la confirmación de desaparición
         * de sesiones.
         *
         * Incluye consultas SSH y esperas de backoff.
         */
        confirmacionSesionDuracionMs:
          removeSessionResult.confirmacionDuracionMs,
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
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `EjecutorSuspenderServicioPppoeService no puede procesar una operación de tipo ${contexto.operacion.tipo}.`,
      );
    }

    if (contexto.cuenta.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE debe estar persistida antes de suspender el servicio.',
      );
    }

    /*
     * El Estado 4 presupone que existe previamente
     * un Secret creado en RouterOS.
     */
    if (!contexto.cuenta.tieneSecretCreado) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no tiene confirmado un secret creado.',
      );
    }

    /**
     * Las cuentas creadas por CRM tienen activadoEn.
     *
     * Las cuentas adoptadas pueden desconocer esa fecha histórica,
     * pero su estado remoto fue verificado durante la adopción.
     */
    const tieneActivacionConfirmada =
      contexto.cuenta.activadoEn !== null || contexto.cuenta.esAdoptada;

    if (!tieneActivacionConfirmada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no tiene una activación confirmada y no puede suspenderse.',
      );
    }
    /*
     * SUSPENDER_SERVICIO no necesita descifrar
     * la contraseña PPPoE.
     */
    if (contexto.passwordPppoe !== null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'SUSPENDER_SERVICIO no debe contener la contraseña PPPoE descifrada.',
      );
    }
  }

  /**
   * Obtiene el orden real de un paso dentro
   * del agregado persistido.
   */
  private getStepOrder(
    pasos: PppoeOperacionPasoReadModel[],
    tipo: TipoPasoPppoe,
  ): number {
    const matches = pasos.filter((paso) => paso.tipo === tipo);

    if (matches.length === 0) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `La operación no contiene el paso ${tipo}.`,
      );
    }

    if (matches.length > 1) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
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
      throw new ProvisionamientoPppoeEstadoInvalidoError(
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
