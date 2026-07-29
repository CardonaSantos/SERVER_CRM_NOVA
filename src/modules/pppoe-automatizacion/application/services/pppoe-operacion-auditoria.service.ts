import { Inject, Injectable, Logger } from '@nestjs/common';

import { PppoeAuditoriaEntity } from 'src/modules/pppoe-auditoria/domain/entities/pppoe-auditoria.entity';

import { AccionAuditoriaPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from 'src/modules/pppoe-auditoria/domain/ports/pppoe-auditoria-repository';

import { DatosAuditoriaPppoe } from 'src/modules/pppoe-auditoria/domain/props/auditoria-entity-props';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PppoeOperacionAuditoriaPort,
  RegistrarAuditoriaOperacionPppoeParams,
  RegistrarAuditoriaRecuperacionPppoeParams,
  RegistrarAuditoriaReintentoPppoeParams,
} from '../../domain/ports/pppoe-operacion-auditoria.port';

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

    await this.persistSafely({
      params,

      accion,

      descripcion: this.buildFinalDescription(params.operacion),

      datos,
    });
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
    } catch {
      /*
       * No se incluye el error original para evitar que
       * mensajes de infraestructura expongan información
       * sensible en los logs.
       */
      this.logger.error(
        `No pudo persistirse la auditoría ${input.accion} de la operación PPPoE ${operacionId}.`,
      );
    }
  }

  /**
   * Datos comunes, deliberadamente sanitizados.
   */
  private buildCommonData(
    operacion: PppoeOperacionEntity,
  ): DatosAuditoriaPppoe {
    return {
      tipoOperacion: operacion.tipo,

      estadoOperacion: operacion.estado,

      numeroIntento: operacion.numeroIntento,

      reintentoDeId: operacion.reintentoDeId,

      routerId: operacion.mikrotikRouterId,

      perfilHomologacionId: operacion.perfilHomologacionId,

      instalacionId: operacion.instalacionId,

      desinstalacionId: operacion.desinstalacionId,
    };
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
}
