import { RutaCobroEntity } from '../entities/ruta-cobro.entity';

export const RUTA_COBRO_REPOSITORY = Symbol('RUTA_COBRO_REPOSITORY');

export interface RutaCobroRepositoryPort {
  /**
   * Impide que otro cambio o cobro de la ruta avance hasta que termine la
   * unidad de trabajo en curso. No falla si no existe.
   */
  bloquearParaModificar(id: number): Promise<void>;

  /**
   * Impide que la ruta cambie mientras se registra un cobro; varios cobros
   * conviven. No falla si no existe.
   */
  bloquearParaCobrar(id: number): Promise<void>;

  /** Devuelve también las eliminadas. */
  findById(id: number): Promise<RutaCobroEntity | null>;

  create(entity: RutaCobroEntity): Promise<RutaCobroEntity>;

  /**
   * Guarda los datos de la ruta; sus clientes solo si `clientes` es `true`.
   * Llámalo con la ruta bloqueada.
   */
  update(
    entity: RutaCobroEntity,
    opciones?: { clientes: boolean },
  ): Promise<void>;
}
