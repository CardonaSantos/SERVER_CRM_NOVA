import { PagoEntity } from '../entities/pago.entity';

export const PAGO_REPOSITORY = Symbol('PAGO_REPOSITORY');

export type EliminacionPago = {
  pago: PagoEntity;
  usuarioId: number;
  motivo: string;
  fecha: Date;
};

export interface PagoRepositoryPort {
  findById(id: number): Promise<PagoEntity | null>;

  /** @throws PagoBoletaDuplicadaError si el número ya está registrado. */
  create(entity: PagoEntity): Promise<PagoEntity>;

  /**
   * Si algún pago vigente usa ese número; `clave` según
   * `claveNumeroBoleta`.
   */
  existeNumeroBoleta(clave: string): Promise<boolean>;

  /** Borra la fila y libera su número de boleta o transferencia. */
  eliminar(id: number): Promise<void>;

  /** Guarda la copia permanente de un pago que se va a eliminar. */
  registrarEliminacion(eliminacion: EliminacionPago): Promise<void>;
}
