import { TipoServicioEntity } from '../entities/tipo-servicio.entity';

export const TIPO_SERVICIO_REPOSITORY = Symbol('TIPO_SERVICIO_REPOSITORY');

export interface TipoServicioRepositoryPort {
  findById(id: number): Promise<TipoServicioEntity | null>;

  /** Todos, por nombre. */
  findAll(): Promise<TipoServicioEntity[]>;

  /** @throws TipoServicioNombreDuplicadoError si el nombre ya existe. */
  create(entity: TipoServicioEntity): Promise<TipoServicioEntity>;
}
