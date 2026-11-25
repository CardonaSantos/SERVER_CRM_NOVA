import { Inject, Injectable } from '@nestjs/common';

import { PppoeOperacionPasoEntity } from '../../domain/entities/pppoe-operacion-paso.entity';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
  OperacionPppoeNoEncontradaError,
  PasoOperacionPppoeNoEncontradoError,
} from '../../domain/errors/pppoe-operacion.errors';

/**
 * Localiza el paso por id o por orden.
 */
export type SelectorPasoPppoe =
  | {
      pasoId: number;
      orden?: never;
    }
  | {
      pasoId?: never;
      orden: number;
    };

/**
 * Datos comunes de todas las acciones.
 */
type ActualizarPasoPppoeBaseInput = {
  empresaId: number;

  operacionId: number;

  selector: SelectorPasoPppoe;

  fecha?: Date;
};

/**
 * Inicia la ejecución de un paso.
 */
export type IniciarPasoPppoeInput = ActualizarPasoPppoeBaseInput & {
  accion: 'INICIAR';

  comandoSanitizado?: string | null;
};

/**
 * Finaliza exitosamente un paso.
 */
export type MarcarPasoPppoeExitosoInput = ActualizarPasoPppoeBaseInput & {
  accion: 'MARCAR_EXITOSO';

  respuestaSanitizada?: string | null;
};

/**
 * Finaliza un paso con error.
 */
export type MarcarPasoPppoeFallidoInput = ActualizarPasoPppoeBaseInput & {
  accion: 'MARCAR_FALLIDO';

  errorCodigo: string;

  errorMensaje: string;

  respuestaSanitizada?: string | null;
};

/**
 * Omite un paso que no necesita ejecución.
 */
export type OmitirPasoPppoeInput = ActualizarPasoPppoeBaseInput & {
  accion: 'OMITIR';

  motivo?: string | null;
};

/**
 * Input discriminado del caso de uso.
 */
export type ActualizarPasoPppoeOperacionUseCaseInput =
  | IniciarPasoPppoeInput
  | MarcarPasoPppoeExitosoInput
  | MarcarPasoPppoeFallidoInput
  | OmitirPasoPppoeInput;

/**
 * Actualiza el estado de un paso perteneciente
 * a una operación PPPoE en ejecución.
 */
@Injectable()
export class ActualizarPasoPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  async execute(
    input: ActualizarPasoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate> {
    this.validateInput(input);

    const aggregate = await this.repository.findAggregateById({
      empresaId: input.empresaId,
      operacionId: input.operacionId,
    });

    if (!aggregate) {
      throw new OperacionPppoeNoEncontradaError();
    }

    const { operacion, pasos } = aggregate;

    if (!operacion.estaEjecutando()) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación debe estar EJECUTANDO. Estado actual: ${operacion.estado}.`,
      );
    }

    const paso = this.findStep(pasos, input.selector);

    if (!paso) {
      throw new PasoOperacionPppoeNoEncontradoError();
    }

    /**
     * Permite repetir una solicitud ya aplicada
     * sin ejecutar nuevamente la transición.
     */
    if (this.isIdempotentRequest(paso, input)) {
      return aggregate;
    }

    this.validateStepSequence(pasos, paso, input.accion);

    this.applyAction(paso, input);

    const savedStep = await this.repository.saveStep({
      empresaId: input.empresaId,
      paso,
    });

    return {
      operacion,

      pasos: pasos.map((currentStep) =>
        currentStep.id === savedStep.id ? savedStep : currentStep,
      ),
    };
  }

  /**
   * Ejecuta el método correspondiente de la entidad.
   */
  private applyAction(
    paso: PppoeOperacionPasoEntity,
    input: ActualizarPasoPppoeOperacionUseCaseInput,
  ): void {
    switch (input.accion) {
      case 'INICIAR':
        paso.iniciar({
          comandoSanitizado: input.comandoSanitizado,
          fecha: input.fecha,
        });

        return;

      case 'MARCAR_EXITOSO':
        paso.marcarExitoso({
          respuestaSanitizada: input.respuestaSanitizada,
          fecha: input.fecha,
        });

        return;

      case 'MARCAR_FALLIDO':
        paso.marcarFallido({
          errorCodigo: input.errorCodigo,
          errorMensaje: input.errorMensaje,
          respuestaSanitizada: input.respuestaSanitizada,
          fecha: input.fecha,
        });

        return;

      case 'OMITIR':
        paso.omitir({
          motivo: input.motivo,
          fecha: input.fecha,
        });

        return;

      default: {
        const exhaustiveCheck: never = input;

        throw new Error(
          `Acción de paso no soportada: ${String(exhaustiveCheck)}.`,
        );
      }
    }
  }

  /**
   * Verifica que los pasos se procesen en orden.
   */
  private validateStepSequence(
    pasos: PppoeOperacionPasoEntity[],
    pasoObjetivo: PppoeOperacionPasoEntity,
    accion: ActualizarPasoPppoeOperacionUseCaseInput['accion'],
  ): void {
    if (accion !== 'INICIAR' && accion !== 'OMITIR') {
      return;
    }

    const executingStep = pasos.find(
      (paso) => paso.estaEjecutando() && paso.id !== pasoObjetivo.id,
    );

    if (executingStep) {
      throw new OperacionPppoeEstadoInvalidoError(
        `El paso ${executingStep.orden} ya se encuentra EJECUTANDO.`,
      );
    }

    const previousSteps = pasos.filter(
      (paso) => paso.orden < pasoObjetivo.orden,
    );

    const invalidPreviousStep = previousSteps.find(
      (paso) => !paso.fueExitoso() && !paso.fueOmitido(),
    );

    if (invalidPreviousStep) {
      throw new OperacionPppoeEstadoInvalidoError(
        `El paso ${pasoObjetivo.orden} no puede procesarse porque el paso ${invalidPreviousStep.orden} está en estado ${invalidPreviousStep.estado}.`,
      );
    }
  }

  /**
   * Busca el paso sin realizar una segunda consulta.
   */
  private findStep(
    pasos: PppoeOperacionPasoEntity[],
    selector: SelectorPasoPppoe,
  ): PppoeOperacionPasoEntity | null {
    if (selector.pasoId !== undefined) {
      return pasos.find((paso) => paso.id === selector.pasoId) ?? null;
    }

    return pasos.find((paso) => paso.orden === selector.orden) ?? null;
  }

  /**
   * Detecta repeticiones de una acción ya aplicada.
   */
  private isIdempotentRequest(
    paso: PppoeOperacionPasoEntity,
    input: ActualizarPasoPppoeOperacionUseCaseInput,
  ): boolean {
    switch (input.accion) {
      case 'INICIAR':
        return paso.estaEjecutando();

      case 'MARCAR_EXITOSO':
        return paso.fueExitoso();

      case 'OMITIR':
        return paso.fueOmitido();

      case 'MARCAR_FALLIDO': {
        if (!paso.fueFallido()) {
          return false;
        }

        const primitives = paso.toPrimitives();

        const errorCodigo = input.errorCodigo.trim().toUpperCase();

        return (
          primitives.errorCodigo === errorCodigo &&
          primitives.errorMensaje === input.errorMensaje.trim()
        );
      }

      default: {
        const exhaustiveCheck: never = input;

        return exhaustiveCheck;
      }
    }
  }

  /**
   * Valida los campos generales y específicos.
   */
  private validateInput(input: ActualizarPasoPppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.validateSelector(input.selector);

    this.assertOptionalDate(input.fecha);

    if (input.accion === 'MARCAR_FALLIDO') {
      this.assertRequiredString(input.errorCodigo, 'errorCodigo');

      this.assertRequiredString(input.errorMensaje, 'errorMensaje');
    }
  }

  /**
   * Exige pasoId u orden, pero no ambos.
   */
  private validateSelector(selector: SelectorPasoPppoe): void {
    const hasStepId = selector.pasoId !== undefined;

    const hasOrder = selector.orden !== undefined;

    if (hasStepId === hasOrder) {
      throw new OperacionPppoeDatosInvalidosError(
        'Debe enviarse pasoId u orden, pero no ambos.',
      );
    }

    if (hasStepId) {
      this.assertPositiveInteger(selector.pasoId!, 'pasoId');
    }

    if (hasOrder) {
      this.assertPositiveInteger(selector.orden!, 'orden');
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new OperacionPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new OperacionPppoeDatosInvalidosError(`${field} es obligatorio.`);
    }
  }

  private assertOptionalDate(value?: Date): void {
    if (value === undefined) {
      return;
    }

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new OperacionPppoeDatosInvalidosError(
        'fecha debe contener una fecha válida.',
      );
    }
  }
}
