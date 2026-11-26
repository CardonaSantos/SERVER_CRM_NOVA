import {
  ClienteDetalleReadModel,
  ClienteEdicionReadModel,
} from '../read-models/cliente-ficha.read-model';

export const CLIENTE_FICHA_QUERY = Symbol('CLIENTE_FICHA_QUERY');

/** Un cliente con todo lo suyo. Incluye eliminados: decide el caso de uso. */
export interface ClienteFichaQueryPort {
  findDetalle(clienteId: number): Promise<ClienteDetalleReadModel | null>;
  findEdicion(clienteId: number): Promise<ClienteEdicionReadModel | null>;
}
