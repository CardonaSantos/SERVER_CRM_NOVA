import { Injectable } from '@nestjs/common';

import { ActualizarPasoPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/actualizar-paso-pppoe-operacion.use-case';

import { PppoeOperacionStepError } from '../errors/pppoe-operacion-step.error';

/**
 * Resultado interno devuelto por la acción técnica
 * ejecutada dentro de un paso.
 */
export type ResultadoAccionPasoPppoe<TValue> = {
  /**
   * Resultado semántico de la acción.
   *
   * Puede ser:
   * - una sesión SSH;
   * - una búsqueda de secret;
   * - una confirmación;
   * - un resultado de gestión.
   */
  value: TValue;

  /**
   * Resumen seguro que puede persistirse.
   *
   * Nunca debe contener stdout, stderr,
   * contraseñas ni comandos completos.
   */
  respuestaSanitizada?: string | null;
};

export type EjecutarPasoPppoeParams<TValue> = {
  empresaId: number;

  operacionId: number;

  /**
   * Número de orden del paso dentro de la operación.
   */
  orden: number;

  /**
   * Descriptor seguro de la acción que está por ejecutarse.
   *
   * No debe contener contraseñas.
   */
  comandoSanitizado?: string | null;

  ejecutar(): Promise<ResultadoAccionPasoPppoe<TValue>>;
};

export type OmitirPasoPppoeParams = {
  empresaId: number;

  operacionId: number;

  orden: number;

  motivo?: string | null;
};

/**
 * Administra el ciclo de vida persistido de un paso PPPoE.
 *
 * El runner no conoce:
 *
 * - el tipo de operación;
 * - la cuenta PPPoE;
 * - la sesión SSH;
 * - el comando RouterOS concreto.
 */
@Injectable()
export class PppoeOperacionStepRunnerService {
  constructor(
    private readonly actualizarPaso: ActualizarPasoPppoeOperacionUseCase,
  ) {}

  async ejecutar<TValue>(
    params: EjecutarPasoPppoeParams<TValue>,
  ): Promise<TValue> {
    this.validateExecutionParams(params);

    /**
     * Primero persistimos que el paso comenzó.
     *
     * Si esto falla, no se ejecuta ninguna acción remota.
     */
    await this.actualizarPaso.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      selector: {
        orden: params.orden,
      },

      accion: 'INICIAR',

      comandoSanitizado: params.comandoSanitizado ?? null,
    });

    try {
      const executionResult = await params.ejecutar();

      await this.actualizarPaso.execute({
        empresaId: params.empresaId,

        operacionId: params.operacionId,

        selector: {
          orden: params.orden,
        },

        accion: 'MARCAR_EXITOSO',

        respuestaSanitizada: executionResult.respuestaSanitizada ?? null,
      });

      return executionResult.value;
    } catch (error: unknown) {
      const normalizedError = PppoeOperacionStepError.from(error);

      /**
       * Intentamos persistir el fallo del paso antes
       * de propagarlo al orquestador.
       *
       * El orquestador decidirá posteriormente si la
       * operación finaliza FALLIDA o PARCIAL.
       */
      try {
        await this.actualizarPaso.execute({
          empresaId: params.empresaId,

          operacionId: params.operacionId,

          selector: {
            orden: params.orden,
          },

          accion: 'MARCAR_FALLIDO',

          errorCodigo: normalizedError.errorCodigo,

          errorMensaje: normalizedError.message,

          respuestaSanitizada: null,
        });
      } catch {
        /**
         * No sustituimos el error técnico original por un
         * posible error secundario de persistencia.
         *
         * Si el paso queda EJECUTANDO, el futuro proceso
         * de recuperación lo detectará como interrumpido.
         */
      }

      throw normalizedError;
    }
  }

  /**
   * Marca un paso como OMITIDO sin ejecutar una acción remota.
   *
   * Ejemplos:
   *
   * - el secret ya existe;
   * - el secret ya está habilitado;
   * - el secret ya está deshabilitado;
   * - no existen sesiones activas.
   */
  async omitir(params: OmitirPasoPppoeParams): Promise<void> {
    this.validateBaseParams(params);

    await this.actualizarPaso.execute({
      empresaId: params.empresaId,

      operacionId: params.operacionId,

      selector: {
        orden: params.orden,
      },

      accion: 'OMITIR',

      motivo: params.motivo ?? null,
    });
  }

  private validateExecutionParams<TValue>(
    params: EjecutarPasoPppoeParams<TValue>,
  ): void {
    this.validateBaseParams(params);

    if (typeof params.ejecutar !== 'function') {
      throw new Error('La acción técnica del paso PPPoE es obligatoria.');
    }
  }

  private validateBaseParams(params: {
    empresaId: number;

    operacionId: number;

    orden: number;
  }): void {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.operacionId, 'operacionId');

    this.assertPositiveInteger(params.orden, 'orden');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
