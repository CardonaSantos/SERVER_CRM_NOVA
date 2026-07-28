import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrigenOperacionPppoe } from '../../../pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '../../domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';

import { CrearPppoeOperacionPasoInicialProps } from '../../domain/props/pppoe-operacion-paso.props';

/**
 * Datos necesarios para generar un nuevo intento.
 */
export type CrearReintentoPppoeOperacionUseCaseInput = {
  empresaId: number;

  /**
   * Puede ser la operación raíz o cualquier intento
   * perteneciente a la misma cadena.
   */
  operacionId: number;

  /**
   * Debe ser diferente a la clave utilizada
   * en intentos anteriores.
   */
  claveIdempotencia: string;

  iniciadoPorId: number | null;

  origen?: OrigenOperacionPppoe;

  canal?: CanalOperacionPppoe;

  requiereReautenticacion?: boolean;

  motivo?: string | null;

  perfilHomologacionId?: number | null;

  codigoPerfilSnapshot?: string | null;

  mikrotikRouterId?: number;

  routerHostSnapshot?: string;

  routerPuertoSnapshot?: number;
};

/**
 * Crea un nuevo intento a partir del último intento
 * FALLIDO o PARCIAL de una cadena.
 */
@Injectable()
export class CrearReintentoPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  async execute(
    input: CrearReintentoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate> {
    this.validateInput(input);

    const operacionSolicitada = await this.repository.findById({
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    if (!operacionSolicitada) {
      throw new NotFoundException(
        `No existe la operación PPPoE ${input.operacionId}.`,
      );
    }

    const operacionRaizId = this.resolveRootOperationId(operacionSolicitada);

    /**
     * La misma clave idempotente devuelve
     * el reintento creado anteriormente.
     */
    const existingOperation = await this.repository.findByIdempotencyKey({
      empresaId: input.empresaId,

      claveIdempotencia: input.claveIdempotencia,
    });

    if (existingOperation) {
      this.assertCompatibleIdempotentRetry(
        existingOperation,
        operacionSolicitada,
        operacionRaizId,
      );

      return this.loadExistingAggregate(input.empresaId, existingOperation);
    }

    /**
     * Siempre se reintenta desde el último intento
     * de la cadena, no desde uno antiguo.
     */
    const ultimoIntento = await this.repository.findLatestAttempt({
      empresaId: input.empresaId,

      operacionRaizId,
    });

    if (!ultimoIntento) {
      throw new NotFoundException(
        `No se encontró la cadena de intentos de la operación ${operacionRaizId}.`,
      );
    }

    if (!ultimoIntento.puedeReintentarse()) {
      throw new ConflictException(
        `El último intento se encuentra en estado ${ultimoIntento.estado} y no puede reintentarse.`,
      );
    }

    const runningOperation = await this.repository.findRunningOperation({
      empresaId: input.empresaId,

      cuentaPppoeId: ultimoIntento.cuentaPppoeId,

      estados: [
        EstadoOperacionPppoe.PENDIENTE,
        EstadoOperacionPppoe.AUTORIZADA,
        EstadoOperacionPppoe.EJECUTANDO,
      ],
    });

    if (runningOperation) {
      throw new ConflictException(
        `La cuenta PPPoE ya tiene una operación en curso: ${runningOperation.id}.`,
      );
    }

    const reintento = this.createRetryEntity(ultimoIntento, input);

    const pasos = this.buildInitialSteps(reintento.tipo);

    return this.repository.createWithSteps({
      operacion: reintento,

      pasos,
    });
  }

  /**
   * Crea la nueva entidad usando las reglas
   * de la operación anterior.
   */
  private createRetryEntity(
    ultimoIntento: PppoeOperacionEntity,
    input: CrearReintentoPppoeOperacionUseCaseInput,
  ): PppoeOperacionEntity {
    try {
      return ultimoIntento.crearReintento({
        claveIdempotencia: input.claveIdempotencia,

        iniciadoPorId: input.iniciadoPorId,

        origen: input.origen,

        canal: input.canal,

        requiereReautenticacion: input.requiereReautenticacion,

        motivo: input.motivo,

        perfilHomologacionId: input.perfilHomologacionId,

        codigoPerfilSnapshot: input.codigoPerfilSnapshot,

        mikrotikRouterId: input.mikrotikRouterId,

        routerHostSnapshot: input.routerHostSnapshot,

        routerPuertoSnapshot: input.routerPuertoSnapshot,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  /**
   * Determina la operación raíz de la cadena.
   */
  private resolveRootOperationId(operacion: PppoeOperacionEntity): number {
    if (operacion.reintentoDeId !== null) {
      return operacion.reintentoDeId;
    }

    if (operacion.id === null) {
      throw new Error('La operación persistida no contiene id.');
    }

    return operacion.id;
  }

  /**
   * Carga el agregado de una solicitud
   * idempotente ya procesada.
   */
  private async loadExistingAggregate(
    empresaId: number,
    operacion: PppoeOperacionEntity,
  ): Promise<PppoeOperacionAggregate> {
    if (operacion.id === null) {
      throw new Error('La operación idempotente no contiene id.');
    }

    const aggregate = await this.repository.findAggregateById({
      empresaId,

      operacionId: operacion.id,
    });

    if (!aggregate) {
      throw new Error(`No pudo cargarse el agregado PPPoE ${operacion.id}.`);
    }

    return aggregate;
  }

  /**
   * Comprueba que la clave existente pertenezca
   * a la misma cadena e intención.
   */
  private assertCompatibleIdempotentRetry(
    existing: PppoeOperacionEntity,
    requested: PppoeOperacionEntity,
    operacionRaizId: number,
  ): void {
    const sameAccount = existing.cuentaPppoeId === requested.cuentaPppoeId;

    const sameType = existing.tipo === requested.tipo;

    const sameRoot = existing.reintentoDeId === operacionRaizId;

    const isRetry = existing.numeroIntento > 1;

    if (sameAccount && sameType && sameRoot && isRetry) {
      return;
    }

    throw new ConflictException(
      'La clave de idempotencia ya pertenece a otra operación PPPoE.',
    );
  }

  /**
   * Genera los pasos correspondientes al tipo
   * de operación.
   */
  private buildInitialSteps(
    tipo: TipoOperacionPppoe,
  ): CrearPppoeOperacionPasoInicialProps[] {
    switch (tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,
          TipoPasoPppoe.BUSCAR_SECRET,
          TipoPasoPppoe.AGREGAR_SECRET,
          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,
          TipoPasoPppoe.BUSCAR_SECRET,
          TipoPasoPppoe.HABILITAR_SECRET,
          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,
          TipoPasoPppoe.BUSCAR_SECRET,
          TipoPasoPppoe.DESHABILITAR_SECRET,
          TipoPasoPppoe.REMOVER_SESION_ACTIVA,
          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,
          TipoPasoPppoe.BUSCAR_SECRET,
          TipoPasoPppoe.DESHABILITAR_SECRET,
          TipoPasoPppoe.REMOVER_SESION_ACTIVA,
          TipoPasoPppoe.ELIMINAR_SECRET,
          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      default: {
        const exhaustiveCheck: never = tipo;

        throw new Error(`Tipo de operación no soportado: ${exhaustiveCheck}.`);
      }
    }
  }

  private createSteps(
    tipos: TipoPasoPppoe[],
  ): CrearPppoeOperacionPasoInicialProps[] {
    return tipos.map((tipo, index) => ({
      tipo,

      orden: index + 1,
    }));
  }

  private validateInput(input: CrearReintentoPppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertRequiredString(input.claveIdempotencia, 'claveIdempotencia');

    if (input.iniciadoPorId !== null) {
      this.assertPositiveInteger(input.iniciadoPorId, 'iniciadoPorId');
    }

    this.assertOptionalPositiveInteger(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    this.assertOptionalPositiveInteger(
      input.mikrotikRouterId,
      'mikrotikRouterId',
    );

    this.assertOptionalPort(input.routerPuertoSnapshot);
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private assertOptionalPositiveInteger(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === undefined || value === null) {
      return;
    }

    this.assertPositiveInteger(value, field);
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
  }

  private assertOptionalPort(value?: number): void {
    if (value === undefined) {
      return;
    }

    if (!Number.isInteger(value) || value < 1 || value > 65_535) {
      throw new BadRequestException(
        'routerPuertoSnapshot debe estar entre 1 y 65535.',
      );
    }
  }
}
