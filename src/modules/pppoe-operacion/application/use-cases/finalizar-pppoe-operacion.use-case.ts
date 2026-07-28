import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import { PppoeOperacionPasoEntity } from '../../domain/entities/pppoe-operacion-paso.entity';
import {
  EstadoOperacionPppoe,
  TipoPasoPppoe,
} from '../../domain/enums/pppoe-operacion-operacion-paso.enums';
import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';
import { PppoeOperacionResultado } from '../../domain/props/pppoe-operacion.props';

/**
 * Datos comunes de la finalización.
 */
type FinalizarPppoeOperacionBaseInput = {
  empresaId: number;

  operacionId: number;

  resultado?: PppoeOperacionResultado | null;

  fecha?: Date;
};

/**
 * Finalización completamente exitosa.
 */
export type FinalizarPppoeOperacionExitosaInput =
  FinalizarPppoeOperacionBaseInput & {
    estadoFinal: EstadoOperacionPppoe.EXITOSA;

    errorCodigo?: never;

    errorMensaje?: never;
  };

/**
 * Finalización con efecto remoto posible,
 * pero sin confirmación completa.
 */
export type FinalizarPppoeOperacionParcialInput =
  FinalizarPppoeOperacionBaseInput & {
    estadoFinal: EstadoOperacionPppoe.PARCIAL;

    errorCodigo: string;

    errorMensaje: string;
  };

/**
 * Finalización sin completar el objetivo técnico.
 */
export type FinalizarPppoeOperacionFallidaInput =
  FinalizarPppoeOperacionBaseInput & {
    estadoFinal: EstadoOperacionPppoe.FALLIDA;

    errorCodigo: string;

    errorMensaje: string;
  };

/**
 * Input discriminado del caso de uso.
 */
export type FinalizarPppoeOperacionUseCaseInput =
  | FinalizarPppoeOperacionExitosaInput
  | FinalizarPppoeOperacionParcialInput
  | FinalizarPppoeOperacionFallidaInput;

/**
 * Finaliza una operación PPPoE después de revisar
 * el resultado de sus pasos técnicos.
 */
@Injectable()
export class FinalizarPppoeOperacionUseCase {
  /**
   * Pasos que pueden modificar el estado remoto
   * del router MikroTik.
   */
  private static readonly PASOS_CON_EFECTO_REMOTO = new Set<TipoPasoPppoe>([
    TipoPasoPppoe.AGREGAR_SECRET,

    TipoPasoPppoe.HABILITAR_SECRET,

    TipoPasoPppoe.DESHABILITAR_SECRET,

    TipoPasoPppoe.REMOVER_SESION_ACTIVA,

    TipoPasoPppoe.ELIMINAR_SECRET,
  ]);

  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  async execute(
    input: FinalizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate> {
    this.validateInput(input);

    const aggregate = await this.repository.findAggregateById({
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    if (!aggregate) {
      throw new NotFoundException(
        `No existe la operación PPPoE ${input.operacionId}.`,
      );
    }

    const { operacion, pasos } = aggregate;

    /**
     * Repetir la misma finalización no genera
     * una segunda actualización.
     */
    if (operacion.estado === input.estadoFinal) {
      return aggregate;
    }

    if (operacion.esTerminal()) {
      throw new ConflictException(
        `La operación ya terminó en estado ${operacion.estado}.`,
      );
    }

    if (!operacion.estaEjecutando()) {
      throw new ConflictException(
        `La operación debe estar EJECUTANDO. Estado actual: ${operacion.estado}.`,
      );
    }

    if (pasos.length === 0) {
      throw new ConflictException('La operación no contiene pasos técnicos.');
    }

    this.validateSteps(pasos, input.estadoFinal);

    this.applyFinalization(operacion, input);

    const savedOperation = await this.repository.saveOperation(operacion);

    return {
      operacion: savedOperation,

      pasos,
    };
  }

  /**
   * Aplica la transición sobre la entidad principal.
   */
  private applyFinalization(
    operacion: PppoeOperacionEntity,
    input: FinalizarPppoeOperacionUseCaseInput,
  ): void {
    try {
      switch (input.estadoFinal) {
        case EstadoOperacionPppoe.EXITOSA:
          operacion.marcarExitosa({
            resultado: input.resultado,
            fecha: input.fecha,
          });

          return;

        case EstadoOperacionPppoe.PARCIAL:
          operacion.marcarParcial({
            errorCodigo: input.errorCodigo,

            errorMensaje: input.errorMensaje,

            resultado: input.resultado,

            fecha: input.fecha,
          });

          return;

        case EstadoOperacionPppoe.FALLIDA:
          operacion.marcarFallida({
            errorCodigo: input.errorCodigo,

            errorMensaje: input.errorMensaje,

            resultado: input.resultado,

            fecha: input.fecha,
          });

          return;

        default: {
          const exhaustiveCheck: never = input;

          throw new Error(
            `Estado final no soportado: ${String(exhaustiveCheck)}.`,
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  /**
   * Valida que los pasos respalden
   * el estado final solicitado.
   */
  private validateSteps(
    pasos: PppoeOperacionPasoEntity[],
    estadoFinal:
      | EstadoOperacionPppoe.EXITOSA
      | EstadoOperacionPppoe.PARCIAL
      | EstadoOperacionPppoe.FALLIDA,
  ): void {
    const pasoEjecutando = pasos.find((paso) => paso.estaEjecutando());

    if (pasoEjecutando) {
      throw new ConflictException(
        `El paso ${pasoEjecutando.orden} todavía está EJECUTANDO.`,
      );
    }

    switch (estadoFinal) {
      case EstadoOperacionPppoe.EXITOSA:
        this.validateSuccessfulSteps(pasos);

        return;

      case EstadoOperacionPppoe.PARCIAL:
        this.validatePartialSteps(pasos);

        return;

      case EstadoOperacionPppoe.FALLIDA:
        this.validateFailedSteps(pasos);

        return;

      default: {
        const exhaustiveCheck: never = estadoFinal;

        throw new Error(`Estado final no soportado: ${exhaustiveCheck}.`);
      }
    }
  }

  /**
   * Una operación exitosa solo puede contener
   * pasos EXITOSOS u OMITIDOS.
   */
  private validateSuccessfulSteps(pasos: PppoeOperacionPasoEntity[]): void {
    const invalidStep = pasos.find(
      (paso) => !paso.fueExitoso() && !paso.fueOmitido(),
    );

    if (!invalidStep) {
      return;
    }

    throw new ConflictException(
      `La operación no puede finalizar como EXITOSA porque el paso ${invalidStep.orden} está en estado ${invalidStep.estado}.`,
    );
  }

  /**
   * Una operación fallida debe contener
   * al menos un paso FALLIDO.
   */
  private validateFailedSteps(pasos: PppoeOperacionPasoEntity[]): void {
    const failedStep = pasos.find((paso) => paso.fueFallido());

    if (failedStep) {
      return;
    }

    throw new ConflictException(
      'La operación no puede finalizar como FALLIDA porque ninguno de sus pasos está FALLIDO.',
    );
  }

  /**
   * PARCIAL requiere un fallo y evidencia de que
   * un paso modificador pudo afectar el router.
   */
  private validatePartialSteps(pasos: PppoeOperacionPasoEntity[]): void {
    const failedStep = pasos.find((paso) => paso.fueFallido());

    if (!failedStep) {
      throw new ConflictException(
        'La operación PARCIAL debe contener al menos un paso FALLIDO.',
      );
    }

    const possibleRemoteEffect = pasos.some(
      (paso) =>
        FinalizarPppoeOperacionUseCase.PASOS_CON_EFECTO_REMOTO.has(paso.tipo) &&
        (paso.fueExitoso() || paso.fueFallido()),
    );

    if (!possibleRemoteEffect) {
      throw new ConflictException(
        'No existe evidencia de un posible efecto remoto. La operación debe finalizar como FALLIDA.',
      );
    }
  }

  /**
   * Valida identificadores, fecha y errores.
   */
  private validateInput(input: FinalizarPppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertOptionalDate(input.fecha);

    if (
      input.estadoFinal === EstadoOperacionPppoe.PARCIAL ||
      input.estadoFinal === EstadoOperacionPppoe.FALLIDA
    ) {
      this.assertRequiredString(input.errorCodigo, 'errorCodigo');

      this.assertRequiredString(input.errorMensaje, 'errorMensaje');
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
  }

  private assertOptionalDate(value?: Date): void {
    if (value === undefined) {
      return;
    }

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new BadRequestException('fecha debe contener una fecha válida.');
    }
  }
}
