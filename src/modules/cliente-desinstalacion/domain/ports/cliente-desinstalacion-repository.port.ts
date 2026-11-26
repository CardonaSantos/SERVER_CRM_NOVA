import { ClienteDesinstalacionEntity } from '../entities/cliente-desinstalacion.entity';

export const CLIENTE_DESINSTALACION_REPOSITORY = Symbol(
  'CLIENTE_DESINSTALACION_REPOSITORY',
);

export interface ClienteDesinstalacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;

  findById(id: number): Promise<ClienteDesinstalacionEntity | null>;

  /** Guarda los cambios hechos con los métodos de la entidad. */
  save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;
}
