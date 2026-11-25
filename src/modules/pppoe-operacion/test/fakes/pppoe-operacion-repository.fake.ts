import { PppoeOperacionPasoEntity } from '../../domain/entities/pppoe-operacion-paso.entity';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import {
  BuscarPppoeOperacionEnCursoParams,
  BuscarPppoeOperacionPasoPorIdParams,
  BuscarPppoeOperacionPasoPorOrdenParams,
  BuscarPppoeOperacionPorIdParams,
  BuscarPppoeOperacionPorIdempotenciaParams,
  BuscarUltimaOperacionCuentaPppoeParams,
  BuscarUltimoIntentoPppoeParams,
  CrearPppoeOperacionAggregateParams,
  GuardarPppoeOperacionPasoParams,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
  ReclamarPppoeOperacionParaEjecucionParams,
} from '../../domain/ports/pppoe-operacion-repository.port';

/** Operaciones y pasos en memoria; asigna ids como la BD. */
export class PppoeOperacionRepositoryFake
  implements PppoeOperacionRepositoryPort
{
  private readonly operaciones = new Map<number, PppoeOperacionEntity>();
  private readonly pasos = new Map<number, PppoeOperacionPasoEntity>();
  private siguienteId = 1;
  private siguientePasoId = 1;

  /** Simula que otro proceso tomó la operación justo antes del reclamo. */
  reclamoFalla = false;

  async createWithSteps(
    params: CrearPppoeOperacionAggregateParams,
  ): Promise<PppoeOperacionAggregate> {
    const primitivos = params.operacion.toPrimitives();
    const operacion = PppoeOperacionEntity.hydrate({
      ...primitivos,
      id: this.siguienteId++,
    });
    this.operaciones.set(operacion.id!, operacion);

    for (const paso of params.pasos) {
      const nuevo = PppoeOperacionPasoEntity.create(
        { operacionId: operacion.id!, tipo: paso.tipo, orden: paso.orden },
        primitivos.creadoEn,
      );
      this.guardarPaso(
        PppoeOperacionPasoEntity.hydrate({
          ...nuevo.toPrimitives(),
          id: this.siguientePasoId++,
        }),
      );
    }

    return (await this.findAggregateById({
      operacionId: operacion.id!,
    }))!;
  }

  async saveOperation(
    entity: PppoeOperacionEntity,
  ): Promise<PppoeOperacionEntity> {
    const guardada = PppoeOperacionEntity.hydrate(entity.toPrimitives());
    this.operaciones.set(guardada.id!, guardada);
    return this.copia(guardada)!;
  }

  async claimForExecution(
    params: ReclamarPppoeOperacionParaEjecucionParams,
  ): Promise<PppoeOperacionEntity | null> {
    const actual = this.operaciones.get(params.operacionId);
    if (this.reclamoFalla || actual?.estado !== params.estadoEsperado) {
      return null;
    }
    return this.saveOperation(params.operacionIniciada);
  }

  async saveStep(
    params: GuardarPppoeOperacionPasoParams,
  ): Promise<PppoeOperacionPasoEntity> {
    return this.guardarPaso(
      PppoeOperacionPasoEntity.hydrate(params.paso.toPrimitives()),
    );
  }

  async findById(
    params: BuscarPppoeOperacionPorIdParams,
  ): Promise<PppoeOperacionEntity | null> {
    return this.copia(this.operaciones.get(params.operacionId));
  }

  async findAggregateById(
    params: BuscarPppoeOperacionPorIdParams,
  ): Promise<PppoeOperacionAggregate | null> {
    const operacion = this.copia(this.operaciones.get(params.operacionId));
    if (!operacion) return null;
    return { operacion, pasos: this.pasosDe(params.operacionId) };
  }

  async findStepById(
    params: BuscarPppoeOperacionPasoPorIdParams,
  ): Promise<PppoeOperacionPasoEntity | null> {
    return (
      this.pasosDe(params.operacionId).find((p) => p.id === params.pasoId) ??
      null
    );
  }

  async findStepByOrder(
    params: BuscarPppoeOperacionPasoPorOrdenParams,
  ): Promise<PppoeOperacionPasoEntity | null> {
    return (
      this.pasosDe(params.operacionId).find((p) => p.orden === params.orden) ??
      null
    );
  }

  async findByIdempotencyKey(
    params: BuscarPppoeOperacionPorIdempotenciaParams,
  ): Promise<PppoeOperacionEntity | null> {
    return this.copia(
      this.todas().find(
        (o) => o.claveIdempotencia === params.claveIdempotencia,
      ),
    );
  }

  async findRunningOperation(
    params: BuscarPppoeOperacionEnCursoParams,
  ): Promise<PppoeOperacionEntity | null> {
    return this.copia(
      this.todas().find(
        (o) =>
          o.cuentaPppoeId === params.cuentaPppoeId &&
          params.estados.includes(o.estado) &&
          (!params.tipo || o.tipo === params.tipo) &&
          o.id !== params.excluirOperacionId,
      ),
    );
  }

  async findLatestAttempt(
    params: BuscarUltimoIntentoPppoeParams,
  ): Promise<PppoeOperacionEntity | null> {
    const cadena = this.todas().filter(
      (o) =>
        o.id === params.operacionRaizId ||
        o.reintentoDeId === params.operacionRaizId,
    );
    return this.copia(
      cadena.sort((a, b) => b.numeroIntento - a.numeroIntento)[0],
    );
  }

  async findLatestByAccount(
    params: BuscarUltimaOperacionCuentaPppoeParams,
  ): Promise<PppoeOperacionEntity | null> {
    const deCuenta = this.todas().filter(
      (o) =>
        o.cuentaPppoeId === params.cuentaPppoeId &&
        (!params.tipo || o.tipo === params.tipo),
    );
    return this.copia(deCuenta.sort((a, b) => b.id! - a.id!)[0]);
  }

  private guardarPaso(
    paso: PppoeOperacionPasoEntity,
  ): PppoeOperacionPasoEntity {
    this.pasos.set(paso.id!, paso);
    return PppoeOperacionPasoEntity.hydrate(paso.toPrimitives());
  }

  private pasosDe(operacionId: number): PppoeOperacionPasoEntity[] {
    return [...this.pasos.values()]
      .filter((p) => p.operacionId === operacionId)
      .sort((a, b) => a.orden - b.orden)
      .map((p) => PppoeOperacionPasoEntity.hydrate(p.toPrimitives()));
  }

  private todas(): PppoeOperacionEntity[] {
    return [...this.operaciones.values()];
  }

  private copia(
    entity: PppoeOperacionEntity | undefined,
  ): PppoeOperacionEntity | null {
    return entity ? PppoeOperacionEntity.hydrate(entity.toPrimitives()) : null;
  }
}
