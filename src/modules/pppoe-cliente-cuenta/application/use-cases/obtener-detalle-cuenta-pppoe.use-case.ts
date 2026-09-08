import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from '../../domain/enums/pppoe-cliente-cuenta.enum';

import {
  CLIENTE_PPPOE_CUENTA_QUERY,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/pppoe-cliente-cuenta-query.port';

import {
  ClientePppoeCuentaDetalleAccion,
  ClientePppoeCuentaDetalleOperacionAccion,
  ClientePppoeCuentaDetalleReadModel,
  ClientePppoeCuentaDetalleResult,
} from '../../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';

import { OrigenCuentaPppoe } from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

export type ObtenerDetalleCuentaPppoeInput = {
  empresaId: number;

  cuentaPppoeId: number;
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
        provisionar: this.resolveProvisionar(detalle),

        suspender: this.resolveSuspender(detalle),

        reactivar: this.resolveReactivar(detalle),

        reintentarOperacion: this.resolveReintentar(detalle),

        recuperarOperacion: this.resolveRecuperar(detalle),
      },
    };
  }

  /**
   * Provisionamiento inicial administrativo.
   *
   * Solo corresponde a cuentas creadas mediante
   * ALTA_MANUAL.
   */
  private resolveProvisionar(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleAccion {
    if (detalle.origen !== OrigenCuentaPppoe.ALTA_MANUAL) {
      return {
        habilitada: false,

        motivo:
          'La cuenta pertenece al flujo de instalación y debe provisionarse desde esa instalación.',
      };
    }

    if (this.hasOperationInProgress(detalle)) {
      return {
        habilitada: false,

        motivo: 'Existe una operación PPPoE en curso sobre la cuenta.',
      };
    }

    if (detalle.estadoCuenta === EstadoCuentaPppoe.PENDIENTE_ACTIVACION) {
      return {
        habilitada: true,

        motivo: null,
      };
    }

    /**
     * Caso importante:
     *
     * CREAR_SECRET original falla
     *      ->
     * reintento exitoso
     *      ->
     * EN_INSTALACION + secretCreadoEn
     *
     * Desde aquí el orquestador manual puede continuar
     * directamente con ACTIVAR_SECRET.
     */
    if (
      detalle.estadoCuenta === EstadoCuentaPppoe.EN_INSTALACION &&
      detalle.secretCreadoEn !== null
    ) {
      return {
        habilitada: true,

        motivo: null,
      };
    }

    return {
      habilitada: false,

      motivo: `La cuenta no puede provisionarse desde el estado ${detalle.estadoCuenta}.`,
    };
  }

  private resolveSuspender(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): ClientePppoeCuentaDetalleAccion {
    if (this.hasOperationInProgress(detalle)) {
      return {
        habilitada: false,

        motivo: 'Existe una operación PPPoE en curso sobre la cuenta.',
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
    if (this.hasOperationInProgress(detalle)) {
      return {
        habilitada: false,

        motivo: 'Existe una operación PPPoE en curso sobre la cuenta.',
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

  /**
   * Una operación puede reintentarse únicamente
   * cuando el último intento terminó FALLIDA o PARCIAL.
   *
   * No ofrecemos reintentar fallos históricos que
   * posteriormente ya fueron corregidos.
   */
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

    if (
      operacion.estado === EstadoOperacionPppoe.FALLIDA ||
      operacion.estado === EstadoOperacionPppoe.PARCIAL
    ) {
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

  /**
   * EJECUTANDO requiere el flujo explícito de
   * recuperación de operación interrumpida.
   *
   * La UI deberá solicitar confirmación antes de
   * llamar al endpoint de recuperación.
   */
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
   * Una operación pendiente, autorizada o ejecutándose
   * bloquea la creación de otra acción administrativa
   * concurrente sobre la cuenta.
   */
  private hasOperationInProgress(
    detalle: ClientePppoeCuentaDetalleReadModel,
  ): boolean {
    const estado = detalle.ultimaOperacion?.estado;

    if (!estado) {
      return false;
    }

    return [
      EstadoOperacionPppoe.PENDIENTE,
      EstadoOperacionPppoe.AUTORIZADA,
      EstadoOperacionPppoe.EJECUTANDO,
    ].includes(estado);
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
