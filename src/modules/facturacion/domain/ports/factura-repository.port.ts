import { FacturaEntity } from '../entities/factura.entity';

export const FACTURA_REPOSITORY = Symbol('FACTURA_REPOSITORY');

export type EliminacionFactura = {
  factura: FacturaEntity;
  usuarioId: number;
  motivo: string;
  fecha: Date;
};

export interface FacturaRepositoryPort {
  /** La factura con sus pagos. */
  findById(id: number): Promise<FacturaEntity | null>;

  /** @throws FacturaDuplicadaError si el cliente ya tiene ese periodo. */
  create(entity: FacturaEntity): Promise<FacturaEntity>;

  /** Guarda monto, saldo, estado, fechas y detalle. */
  update(entity: FacturaEntity): Promise<void>;

  /** Borra la fila. Quien llama garantiza que no tiene pagos. */
  eliminar(id: number): Promise<void>;

  /** Deja en la bitácora la copia de una factura que se va a eliminar. */
  registrarEliminacion(eliminacion: EliminacionFactura): Promise<void>;

  /** Cuáles de esos periodos ya tiene el cliente, en cualquier zona. */
  periodosEmitidos(clienteId: number, periodos: string[]): Promise<string[]>;

  /** Facturas del cliente que todavía se deben. */
  contarPendientes(clienteId: number): Promise<number>;
}
