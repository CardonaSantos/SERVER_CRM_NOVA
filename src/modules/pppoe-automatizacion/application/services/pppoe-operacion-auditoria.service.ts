import { Inject, Injectable, Logger } from '@nestjs/common';

import { PppoeAuditoriaEntity } from 'src/modules/pppoe-auditoria/domain/entities/pppoe-auditoria.entity';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from 'src/modules/pppoe-auditoria/domain/ports/pppoe-auditoria-repository';

import { DatosAuditoriaPppoe } from 'src/modules/pppoe-auditoria/domain/props/auditoria-entity-props';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PppoeOperacionAuditoriaPort,
  RegistrarAuditoriaOperacionPppoeParams,
  RegistrarAuditoriaRecuperacionPppoeParams,
  RegistrarAuditoriaReintentoPppoeParams,
} from '../../domain/ports/pppoe-operacion-auditoria.port';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

/**
 * Registra la bitácora principal de las operaciones PPPoE.
 *
 * La persistencia se realiza de manera defensiva:
 *
 * - un fallo de auditoría se registra en logs;
 * - no altera el resultado funcional ya obtenido;
 * - nunca provoca la repetición de comandos SSH.
 *
 * Más adelante este comportamiento puede reforzarse
 * mediante outbox transaccional.
 */
@Injectable()
export class PppoeOperacionAuditoriaService
  implements PppoeOperacionAuditoriaPort
{
  private readonly logger = new Logger(PppoeOperacionAuditoriaService.name);

  constructor(
    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly repository: PppoeAuditoriaRepositoryPort,
  ) {}

  async registrarCreada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void> {
    await this.persistSafely({
      params,

      accion: AccionAuditoriaPppoe.OPERACION_CREADA,

      descripcion: `Se creó la operación PPPoE ${params.operacion.tipo}, intento ${params.operacion.numeroIntento}.`,

      datos: this.buildCommonData(params.operacion),
    });
  }

  async registrarIniciada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void> {
    await this.persistSafely({
      params,

      accion: AccionAuditoriaPppoe.OPERACION_INICIADA,

      descripcion: `Se inició la ejecución técnica de la operación PPPoE ${params.operacion.tipo}.`,

      datos: this.buildCommonData(params.operacion),
    });
  }

  async registrarFinalizada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void> {
    const accion = this.resolveFinalAction(params.operacion);

    if (!accion) {
      this.logger.warn(
        `No se auditó la finalización de la operación ${params.operacion.id} porque su estado es ${params.operacion.estado}.`,
      );

      return;
    }

    const primitives = params.operacion.toPrimitives();

    const datos: DatosAuditoriaPppoe = {
      ...this.buildCommonData(params.operacion),

      errorCodigo: primitives.errorCodigo,

      resultadoDisponible: primitives.resultado !== null,

      reintentable: params.operacion.puedeReintentarse(),
    };

    /*
     * Evento técnico general:
     * OPERACION_EXITOSA, OPERACION_FALLIDA, etc.
     */
    await this.persistSafely({
      params,
      accion,
      descripcion: this.buildFinalDescription(params.operacion),
      datos,
    });

    await this.registrarActivacionInstalacionConfirmada(params);

    /*
     * Evento funcional adicional:
     * SERVICIO_SUSPENDIDO.
     */
    await this.registrarSuspensionManualConfirmada(params);
  }

  async registrarReintentada(
    params: RegistrarAuditoriaReintentoPppoeParams,
  ): Promise<void> {
    const datos: DatosAuditoriaPppoe = {
      ...this.buildCommonData(params.operacion),

      operacionAnteriorId: params.operacionAnteriorId,

      operacionRaizId: params.operacion.reintentoDeId,

      numeroIntento: params.operacion.numeroIntento,
    };

    await this.persistSafely({
      params,

      accion: AccionAuditoriaPppoe.OPERACION_REINTENTADA,

      descripcion: `Se creó el intento ${params.operacion.numeroIntento} de la operación PPPoE ${params.operacion.tipo}.`,

      datos,
    });
  }

  async registrarRecuperada(
    params: RegistrarAuditoriaRecuperacionPppoeParams,
  ): Promise<void> {
    const datos: DatosAuditoriaPppoe = {
      ...this.buildCommonData(params.operacion),

      recuperacion: params.recuperacion,

      estadoOperacionFinal: params.operacion.estado,
    };

    await this.persistSafely({
      params,

      accion: AccionAuditoriaPppoe.OPERACION_RECUPERADA,

      descripcion: `Se recuperó la operación PPPoE ${params.operacion.id}. Resultado: ${params.recuperacion}.`,

      datos,
    });
  }

  /**
   * Construye y persiste un evento sin permitir que un
   * fallo secundario altere el flujo PPPoE principal.
   */
  private async persistSafely(input: {
    params: RegistrarAuditoriaOperacionPppoeParams;

    accion: AccionAuditoriaPppoe;

    descripcion: string;

    datos: DatosAuditoriaPppoe;
  }): Promise<void> {
    const { operacion } = input.params;

    const operacionId = operacion.id;

    if (operacionId === null) {
      this.logger.error(
        'No pudo registrarse una auditoría para una operación sin id.',
      );

      return;
    }

    try {
      const primitives = operacion.toPrimitives();

      const operadorId =
        input.params.actor?.operadorId ?? operacion.iniciadoPorId;

      const entity = PppoeAuditoriaEntity.registrarEventoOperacion({
        empresaId: operacion.empresaId,

        cuentaPppoeId: operacion.cuentaPppoeId,

        perfilHomologacionId: operacion.perfilHomologacionId,

        instalacionId: operacion.instalacionId,

        desinstalacionId: operacion.desinstalacionId,

        operacionId,

        operadorId,

        origen: operacion.origen,

        accion: input.accion,

        descripcion: input.descripcion,

        estadoCuentaAnterior: input.params.estadoCuentaAnterior ?? null,

        estadoCuentaNuevo: input.params.estadoCuentaNuevo ?? null,

        usuarioPppoeSnapshot: operacion.usuarioPppoeSnapshot,

        perfilCodigoSnapshot: primitives.codigoPerfilSnapshot,

        operadorNombreSnapshot: input.params.actor?.operadorNombre ?? null,

        datos: input.datos,

        ipOrigen: input.params.actor?.ipOrigen ?? null,

        userAgent: input.params.actor?.userAgent ?? null,

        creadoEn: input.params.fecha,
      });

      await this.repository.create(entity);
    } catch (error: unknown) {
      const baseMessage =
        `No pudo persistirse la auditoría ${input.accion} ` +
        `de la operación PPPoE ${operacionId}.`;

      if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
        this.logger.error(
          `${baseMessage} ${error.name}: ${error.message}`,
          error.stack,
        );

        return;
      }

      this.logger.error(baseMessage);
    }
  }

  /**
   * Datos comunes, deliberadamente sanitizados.
   */
  private buildCommonData(
    operacion: PppoeOperacionEntity,
  ): DatosAuditoriaPppoe {
    const primitives = operacion.toPrimitives();

    return {
      tipoOperacion: operacion.tipo,

      estadoOperacion: operacion.estado,

      numeroIntento: operacion.numeroIntento,

      reintentoDeId: operacion.reintentoDeId,

      routerId: operacion.mikrotikRouterId,

      perfilHomologacionId: operacion.perfilHomologacionId,

      instalacionId: operacion.instalacionId,

      desinstalacionId: operacion.desinstalacionId,

      motivo: primitives.motivo,
    };
  }

  private async registrarSuspensionManualConfirmada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void> {
    const { operacion, estadoCuentaAnterior, estadoCuentaNuevo } = params;

    /*
     * En esta primera implementación solo auditamos
     * suspensiones manuales de operador.
     */
    if (
      operacion.tipo !== TipoOperacionPppoe.SUSPENDER_SERVICIO ||
      operacion.origen !== OrigenOperacionPppoe.OPERADOR ||
      operacion.estado !== EstadoOperacionPppoe.EXITOSA
    ) {
      return;
    }

    /*
     * La operación técnica debe haber terminado con la
     * cuenta realmente suspendida.
     */
    if (estadoCuentaNuevo !== EstadoCuentaPppoe.SUSPENDIDA) {
      this.logger.warn(
        `La operación ${operacion.id} terminó EXITOSA, pero la cuenta no quedó SUSPENDIDA.`,
      );

      return;
    }

    /*
     * No registramos una transición falsa:
     *
     * SUSPENDIDA -> SUSPENDIDA
     *
     * En ese caso basta con OPERACION_EXITOSA, porque la
     * solicitud únicamente confirmó el estado ya existente.
     */
    if (estadoCuentaAnterior === estadoCuentaNuevo) {
      return;
    }

    const primitives = operacion.toPrimitives();

    const resultado = this.asPlainObject(primitives.resultado);

    const operadorId = params.actor?.operadorId ?? operacion.iniciadoPorId;

    const motivo = primitives.motivo?.trim() || 'Sin motivo registrado';

    const datos: DatosAuditoriaPppoe = {
      ...this.buildCommonData(operacion),

      motivo,

      operacionExitosa: true,

      secretEncontrado: this.readBoolean(resultado, 'secretEncontrado'),

      deshabilitacionOmitida: this.readBoolean(
        resultado,
        'deshabilitacionOmitida',
      ),

      comandoDeshabilitarEjecutado: this.readBoolean(
        resultado,
        'comandoDeshabilitarEjecutado',
      ),

      /*
       * Esto significa que se ejecutó el comando remoto.
       * No significa necesariamente que existiera una
       * sesión activa para eliminar.
       */
      comandoRemocionSesionEjecutado: this.readBoolean(
        resultado,
        'remocionSesionEjecutada',
      ),

      /**
       * Estado observado alrededor de la remoción.
       *
       * Estos contadores permiten distinguir entre:
       *
       * - una suspensión donde había una conexión activa;
       * - una suspensión donde el usuario ya no tenía sesión;
       * - un comportamiento anómalo del router.
       */
      sesionesEncontradas: this.readNumber(resultado, 'sesionesEncontradas'),

      sesionesRemovidas: this.readNumber(resultado, 'sesionesRemovidas'),

      sesionesRestantes: this.readNumber(resultado, 'sesionesRestantes'),

      /**
       * Telemetría de convergencia de RouterOS.
       *
       * La primera comprobación es inmediata y las siguientes
       * corresponden al polling acotado implementado en
       * MikrotikSshSession.
       */
      confirmacionSesionIntentos: this.readNumber(
        resultado,
        'confirmacionSesionIntentos',
      ),

      confirmacionSesionDuracionMs: this.readNumber(
        resultado,
        'confirmacionSesionDuracionMs',
      ),

      secretConfirmado: this.readBoolean(resultado, 'secretConfirmado'),

      deshabilitadoConfirmado: this.readBoolean(resultado, 'deshabilitado'),

      perfilCoincide: this.readBoolean(resultado, 'perfilCoincide'),
    };

    await this.persistSafely({
      params,

      accion: AccionAuditoriaPppoe.SERVICIO_SUSPENDIDO,

      descripcion: operadorId
        ? `El operador ${operadorId} suspendió manualmente el servicio PPPoE. Motivo: ${motivo}.`
        : `El servicio PPPoE fue suspendido manualmente. Motivo: ${motivo}.`,

      datos,
    });
  }

  private resolveFinalAction(
    operacion: PppoeOperacionEntity,
  ): AccionAuditoriaPppoe | null {
    switch (operacion.estado) {
      case EstadoOperacionPppoe.EXITOSA:
        return AccionAuditoriaPppoe.OPERACION_EXITOSA;

      case EstadoOperacionPppoe.PARCIAL:
        return AccionAuditoriaPppoe.OPERACION_PARCIAL;

      case EstadoOperacionPppoe.FALLIDA:
        return AccionAuditoriaPppoe.OPERACION_FALLIDA;

      case EstadoOperacionPppoe.CANCELADA:
        return AccionAuditoriaPppoe.OPERACION_CANCELADA;

      default:
        return null;
    }
  }

  private buildFinalDescription(operacion: PppoeOperacionEntity): string {
    switch (operacion.estado) {
      case EstadoOperacionPppoe.EXITOSA:
        return `La operación PPPoE ${operacion.tipo} finalizó correctamente.`;

      case EstadoOperacionPppoe.PARCIAL:
        return `La operación PPPoE ${operacion.tipo} finalizó parcialmente y requiere revisión o reintento.`;

      case EstadoOperacionPppoe.FALLIDA:
        return `La operación PPPoE ${operacion.tipo} finalizó con error.`;

      case EstadoOperacionPppoe.CANCELADA:
        return `La operación PPPoE ${operacion.tipo} fue cancelada.`;

      default:
        return `La operación PPPoE ${operacion.tipo} cambió al estado ${operacion.estado}.`;
    }
  }

  private async registrarActivacionInstalacionConfirmada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void> {
    const { operacion, estadoCuentaAnterior, estadoCuentaNuevo } = params;

    if (
      operacion.tipo !== TipoOperacionPppoe.ACTIVAR_SECRET ||
      operacion.instalacionId === null ||
      operacion.estado !== EstadoOperacionPppoe.EXITOSA
    ) {
      return;
    }

    if (estadoCuentaNuevo !== EstadoCuentaPppoe.ACTIVA) {
      this.logger.warn(
        `La operación ${operacion.id} terminó EXITOSA, ` +
          'pero la cuenta no quedó ACTIVA.',
      );

      return;
    }

    /*
     * Evita registrar una transición falsa:
     * ACTIVA → ACTIVA.
     */
    if (estadoCuentaAnterior === EstadoCuentaPppoe.ACTIVA) {
      return;
    }

    const primitives = operacion.toPrimitives();

    const motivo =
      primitives.motivo?.trim() || 'Activación autorizada desde oficina';

    await this.persistSafely({
      params,

      accion: AccionAuditoriaPppoe.SERVICIO_ACTIVADO,

      descripcion:
        `Se activó el servicio PPPoE desde la ` +
        `instalación ${operacion.instalacionId}. ` +
        `Motivo: ${motivo}.`,

      datos: {
        ...this.buildCommonData(operacion),

        motivo,

        activacionConfirmada: true,

        instalacionPuestaEnProceso: true,
      },
    });
  }

  private asPlainObject(value: unknown): Record<string, unknown> | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readBoolean(
    source: Record<string, unknown> | null,
    key: string,
  ): boolean | null {
    if (!source) {
      return null;
    }

    const value = source[key];

    return typeof value === 'boolean' ? value : null;
  }

  /**
   * Lee de forma defensiva un valor numérico del resultado
   * técnico persistido.
   *
   * No realizamos coerción de strings a number:
   *
   * "123" !== 123
   *
   * Si el contrato técnico se rompe, preferimos almacenar null
   * en auditoría en vez de ocultar el problema mediante una
   * conversión implícita.
   */
  private readNumber(
    source: Record<string, unknown> | null,
    key: string,
  ): number | null {
    if (!source) {
      return null;
    }

    const value = source[key];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return value;
  }
}
