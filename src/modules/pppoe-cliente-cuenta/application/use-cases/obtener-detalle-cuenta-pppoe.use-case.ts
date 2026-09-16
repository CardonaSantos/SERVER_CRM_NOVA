import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from '../../domain/enums/pppoe-cliente-cuenta.enum';

import { FlujoActivacionCuentaPppoe } from '../../domain/enums/flujo-activacion-cuenta-pppoe.enum';

import {
  CLIENTE_PPPOE_CUENTA_QUERY,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/pppoe-cliente-cuenta-query.port';

import {
  ClientePppoeCuentaDetalleAccion,
  ClientePppoeCuentaDetalleActivacionAccion,
  ClientePppoeCuentaDetalleInstalacion,
  ClientePppoeCuentaDetalleOperacionAccion,
  ClientePppoeCuentaDetalleReadModel,
  ClientePppoeCuentaDetalleResult,
} from '../../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';

import { OrigenCuentaPppoe } from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

export type ObtenerDetalleCuentaPppoeInput = {
  empresaId: number;

  cuentaPppoeId: number;
};

type ContextoActivacionCuentaPppoe = {
  flujo: FlujoActivacionCuentaPppoe | null;

  instalacionId: number | null;

  motivoBloqueo: string | null;
};

@Injectable()
export class ObtenerDetalleCuentaPppoeUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_QUERY)
    private readonly query: ClientePppoeCuentaQueryPort,
  ) {}

  async execute(
    input: ObtenerDetalleCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaDetalleResult> {
    this.validateInput(input);

    const detalle = await this.query.findDetailById({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,
    });

    if (!detalle) {
      throw new NotFoundException(
        `No existe la cuenta PPPoE ${input.cuentaPppoeId}.`,
      );
    }

    return {
      ...detalle,

      acciones: {
        activar: this.resolveActivar(detalle),

        suspender: this.resolveSuspender(detalle),

        reactivar: this.resolveReactivar(detalle),

        reintentarOperacion: this.resolveReintentar(detalle),

        recuperarOperacion: this.resolveRecuperar(detalle),
      },
    };
  }

  /**
   * Resuelve la primera activación de manera contextual.
   *
   * La acción administrativa es siempre:
   *
   * Activar PPPoE
   *
   * pero el orquestador depende del origen de la cuenta.
   */
  private resolveActivar(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleActivacionAccion {
    const contexto = this.resolveContextoActivacion(detalle);

    if (contexto.motivoBloqueo) {
      return {
        habilitada: false,

        motivo: contexto.motivoBloqueo,

        flujo: contexto.flujo,

        instalacionId: contexto.instalacionId,
      };
    }

    const bloqueoOperacion = this.resolveOperationBlockReason(detalle);

    if (bloqueoOperacion) {
      return {
        habilitada: false,

        motivo: bloqueoOperacion,

        flujo: contexto.flujo,

        instalacionId: contexto.instalacionId,
      };
    }

    /**
     * Estado normal inmediatamente después
     * de generar la prealta.
     */
    if (detalle.estadoCuenta === EstadoCuentaPppoe.PENDIENTE_ACTIVACION) {
      return {
        habilitada: true,

        motivo: null,

        flujo: contexto.flujo,

        instalacionId: contexto.instalacionId,
      };
    }

    /**
     * Recuperación válida:
     *
     * CREAR_SECRET
     *      ↓
     * reintento / recuperación
     *      ↓
     * secret confirmado
     *      ↓
     * EN_INSTALACION + secretCreadoEn
     *
     * Desde aquí puede continuarse con ACTIVAR_SECRET.
     */
    if (
      detalle.estadoCuenta === EstadoCuentaPppoe.EN_INSTALACION &&
      detalle.secretCreadoEn !== null
    ) {
      return {
        habilitada: true,

        motivo: null,

        flujo: contexto.flujo,

        instalacionId: contexto.instalacionId,
      };
    }

    return {
      habilitada: false,

      motivo: this.buildActivationStateReason(detalle),

      flujo: contexto.flujo,

      instalacionId: contexto.instalacionId,
    };
  }

  /**
   * Determina qué orquestador debe realizar
   * la primera activación.
   *
   * No ejecuta ninguna mutación.
   */
  private resolveContextoActivacion(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ContextoActivacionCuentaPppoe {
    switch (detalle.origen) {
      case OrigenCuentaPppoe.ALTA_MANUAL:
        return {
          flujo: FlujoActivacionCuentaPppoe.ALTA_MANUAL,

          instalacionId: null,

          motivoBloqueo: null,
        };

      case OrigenCuentaPppoe.INSTALACION:
        return this.resolveContextoInstalacion(detalle);

      case OrigenCuentaPppoe.EXTERNA_ADOPTADA:
        return {
          flujo: null,

          instalacionId: null,

          motivoBloqueo:
            'Las cuentas PPPoE adoptadas no utilizan el flujo de primera activación.',
        };

      default:
        return {
          flujo: null,

          instalacionId: null,

          motivoBloqueo:
            'No fue posible determinar el flujo de activación de la cuenta PPPoE.',
        };
    }
  }

  /**
   * Resuelve específicamente el contexto
   * ClienteInstalacion.
   *
   * instalaciones[] llega ordenado desde la consulta
   * por la vinculación más reciente primero.
   */
  private resolveContextoInstalacion(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ContextoActivacionCuentaPppoe {
    const vinculacion = detalle.instalaciones[0] ?? null;

    if (!vinculacion) {
      return {
        flujo: FlujoActivacionCuentaPppoe.INSTALACION,

        instalacionId: null,

        motivoBloqueo:
          'La cuenta pertenece al flujo de instalación, pero no se encontró la instalación vinculada.',
      };
    }

    const instalacionId = vinculacion.instalacion.id;

    const motivoVinculo = this.resolveInstallationLinkBlockReason(vinculacion);

    if (motivoVinculo) {
      return {
        flujo: FlujoActivacionCuentaPppoe.INSTALACION,

        instalacionId,

        motivoBloqueo: motivoVinculo,
      };
    }

    const motivoEstado = this.resolveInstallationStateBlockReason(
      vinculacion.instalacion.estado,
    );

    if (motivoEstado) {
      return {
        flujo: FlujoActivacionCuentaPppoe.INSTALACION,

        instalacionId,

        motivoBloqueo: motivoEstado,
      };
    }

    return {
      flujo: FlujoActivacionCuentaPppoe.INSTALACION,

      instalacionId,

      motivoBloqueo: null,
    };
  }

  /**
   * Un vínculo RETIRADO ya no representa
   * un acceso operativo de la instalación.
   */
  private resolveInstallationLinkBlockReason(
    vinculacion: ClientePppoeCuentaDetalleInstalacion,
  ): string | null {
    const accion = vinculacion.accion.trim().toUpperCase();

    if (accion === 'RETIRADO') {
      return `El acceso PPPoE fue retirado de la instalación ${vinculacion.instalacion.id}.`;
    }

    return null;
  }

  /**
   * Estados de instalación compatibles con
   * la activación PPPoE.
   *
   * COMPLETADA se conserva porque existen casos
   * históricos donde el trabajo físico terminó antes
   * de que oficina confirmara la activación PPPoE.
   *
   * Ante estados futuros/desconocidos bloqueamos
   * conservadoramente la operación.
   */
  private resolveInstallationStateBlockReason(
    estadoInstalacion: string,
  ): string | null {
    const estado = estadoInstalacion.trim().toUpperCase();

    switch (estado) {
      case 'PROGRAMADA':
      case 'REPROGRAMADA':
      case 'EN_PROCESO':
      case 'COMPLETADA':
        return null;

      case 'CANCELADA':
        return 'La instalación vinculada está cancelada y no permite activar PPPoE.';

      case 'FALLIDA':
        return 'La instalación vinculada está marcada como fallida y no permite activar PPPoE.';

      default:
        return `La instalación vinculada se encuentra en estado ${estadoInstalacion} y no permite activar PPPoE.`;
    }
  }

  private resolveSuspender(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleAccion {
    const bloqueoOperacion = this.resolveOperationBlockReason(detalle);

    if (bloqueoOperacion) {
      return {
        habilitada: false,

        motivo: bloqueoOperacion,
      };
    }

    if (detalle.estadoCuenta !== EstadoCuentaPppoe.ACTIVA) {
      return {
        habilitada: false,

        motivo: 'Solo una cuenta PPPoE activa puede suspenderse.',
      };
    }

    return {
      habilitada: true,

      motivo: null,
    };
  }

  private resolveReactivar(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleAccion {
    const bloqueoOperacion = this.resolveOperationBlockReason(detalle);

    if (bloqueoOperacion) {
      return {
        habilitada: false,

        motivo: bloqueoOperacion,
      };
    }

    if (detalle.estadoCuenta !== EstadoCuentaPppoe.SUSPENDIDA) {
      return {
        habilitada: false,

        motivo: 'Solo una cuenta PPPoE suspendida puede reactivarse.',
      };
    }

    return {
      habilitada: true,

      motivo: null,
    };
  }

  private resolveReintentar(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleOperacionAccion {
    const operacion = detalle.ultimaOperacion;

    if (!operacion) {
      return {
        habilitada: false,

        motivo: 'La cuenta no posee operaciones PPPoE.',

        operacionId: null,
      };
    }

    if (this.isRetryableOperationState(operacion.estado)) {
      return {
        habilitada: true,

        motivo: null,

        operacionId: operacion.id,
      };
    }

    return {
      habilitada: false,

      motivo: 'La última operación no se encuentra en un estado reintentable.',

      operacionId: operacion.id,
    };
  }

  private resolveRecuperar(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleOperacionAccion {
    const operacion = detalle.ultimaOperacion;

    if (!operacion) {
      return {
        habilitada: false,

        motivo: 'La cuenta no posee operaciones PPPoE.',

        operacionId: null,
      };
    }

    if (operacion.estado === EstadoOperacionPppoe.EJECUTANDO) {
      return {
        habilitada: true,

        motivo: null,

        operacionId: operacion.id,
      };
    }

    return {
      habilitada: false,

      motivo: 'La última operación no requiere recuperación.',

      operacionId: operacion.id,
    };
  }

  /**
   * Una nueva acción funcional queda bloqueada
   * mientras exista:
   *
   * - una operación en curso;
   * - una operación FALLIDA/PARCIAL pendiente
   *   de resolución.
   */
  private resolveOperationBlockReason(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): string | null {
    const estado = detalle.ultimaOperacion?.estado;

    if (!estado) {
      return null;
    }

    if (this.isOperationInProgressState(estado)) {
      return 'Existe una operación PPPoE en curso sobre la cuenta.';
    }

    if (this.isRetryableOperationState(estado)) {
      return 'La última operación PPPoE terminó con error y debe resolverse mediante el flujo de reintento antes de ejecutar otra acción.';
    }

    return null;
  }

  private isOperationInProgressState(estado: EstadoOperacionPppoe): boolean {
    return [
      EstadoOperacionPppoe.PENDIENTE,
      EstadoOperacionPppoe.AUTORIZADA,
      EstadoOperacionPppoe.EJECUTANDO,
    ].includes(estado);
  }

  private isRetryableOperationState(estado: EstadoOperacionPppoe): boolean {
    return (
      estado === EstadoOperacionPppoe.FALLIDA ||
      estado === EstadoOperacionPppoe.PARCIAL
    );
  }

  private buildActivationStateReason(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): string {
    switch (detalle.estadoCuenta) {
      case EstadoCuentaPppoe.ACTIVA:
        return 'La cuenta PPPoE ya se encuentra activa.';

      case EstadoCuentaPppoe.SUSPENDIDA:
        return 'La cuenta PPPoE se encuentra suspendida y debe utilizarse la acción Reactivar.';

      case EstadoCuentaPppoe.EN_SUSPENSION:
        return 'La cuenta PPPoE se encuentra dentro de un proceso de suspensión.';

      case EstadoCuentaPppoe.EN_ACTIVACION:
        return 'La cuenta PPPoE ya se encuentra dentro de un proceso de activación.';

      case EstadoCuentaPppoe.EN_DESINSTALACION:
        return 'La cuenta PPPoE se encuentra dentro de un proceso de baja.';

      case EstadoCuentaPppoe.ELIMINADA:
        return 'La cuenta PPPoE fue dada de baja definitivamente.';

      case EstadoCuentaPppoe.CANCELADA:
        return 'La cuenta PPPoE pertenece a un ciclo cancelado.';

      case EstadoCuentaPppoe.ERROR:
        return 'La cuenta PPPoE se encuentra en estado de error y requiere revisión de su operación PPPoE.';

      case EstadoCuentaPppoe.PENDIENTE_CREACION:
        return 'La cuenta PPPoE todavía no ha completado su preparación inicial.';

      case EstadoCuentaPppoe.EN_INSTALACION:
        return detalle.secretCreadoEn === null
          ? 'La cuenta se encuentra en instalación, pero la creación del secret todavía no ha sido confirmada.'
          : 'La cuenta PPPoE aún no cumple las condiciones necesarias para continuar con la activación.';

      default:
        return `La cuenta PPPoE no puede activarse desde el estado ${detalle.estadoCuenta}.`;
    }
  }

  private validateInput(input: ObtenerDetalleCuentaPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
