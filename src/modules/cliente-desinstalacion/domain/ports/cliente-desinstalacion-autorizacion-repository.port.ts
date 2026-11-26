import { ClienteDesinstalacionAutorizacionEntity } from '../entities/cliente-desinstalacion-autorizacion.entity';

export const CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY = Symbol(
  'CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY',
);

export interface ClienteDesinstalacionAutorizacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity>;

  findById(id: number): Promise<ClienteDesinstalacionAutorizacionEntity | null>;

  /** La autorización solicitada más reciente de la desinstalación, de cualquier estado. */
  findUltimaByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null>;

  save(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity>;
}
