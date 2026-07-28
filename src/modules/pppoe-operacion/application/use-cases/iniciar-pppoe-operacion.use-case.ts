import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';

/**
 * Datos necesarios para iniciar una operación.
 */
export type IniciarPppoeOperacionUseCaseInput = {
  empresaId: number;

  operacionId: number;

  /**
   * Si se omite, la entidad utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Inicia la ejecución de una operación PPPoE.
 *
 * Sin reautenticación:
 * PENDIENTE -> EJECUTANDO
 *
 * Con reautenticación:
 * AUTORIZADA -> EJECUTANDO
 */
@Injectable()
export class IniciarPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  async execute(
    input: IniciarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate> {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertOptionalDate(input.fecha);

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
     * Una repetición de la misma solicitud es idempotente.
     */
    if (operacion.estaEjecutando()) {
      return aggregate;
    }

    if (operacion.esTerminal()) {
      throw new ConflictException(
        `La operación no puede iniciarse desde el estado ${operacion.estado}.`,
      );
    }

    if (operacion.requiereReautenticacion && !operacion.estaAutorizada()) {
      throw new ConflictException(
        'La operación debe autorizarse antes de iniciar su ejecución.',
      );
    }

    if (!operacion.requiereReautenticacion && !operacion.estaPendiente()) {
      throw new ConflictException(
        `La operación sin reautenticación debe estar PENDIENTE. Estado actual: ${operacion.estado}.`,
      );
    }

    if (pasos.length === 0) {
      throw new ConflictException('La operación no contiene pasos técnicos.');
    }

    /**
     * Antes de iniciar la operación ningún paso debe
     * haber comenzado.
     */
    const pasoNoPendiente = pasos.find((paso) => !paso.estaPendiente());

    if (pasoNoPendiente) {
      throw new ConflictException(
        `El paso ${pasoNoPendiente.orden} se encuentra en estado ${pasoNoPendiente.estado}.`,
      );
    }

    operacion.iniciar({
      fecha: input.fecha,
    });

    const savedOperation = await this.repository.saveOperation(operacion);

    return {
      operacion: savedOperation,

      pasos,
    };
  }

  /**
   * Valida identificadores enteros positivos.
   */
  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  /**
   * Valida una fecha opcional.
   */
  private assertOptionalDate(value?: Date): void {
    if (value === undefined) {
      return;
    }

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new BadRequestException('fecha debe contener una fecha válida.');
    }
  }
}
