import { ClienteDesinstalacionMediaEntity } from '../entities/cliente-desinstalacion-media.entity';

export const CLIENTE_DESINSTALACION_MEDIA_REPOSITORY = Symbol(
  'CLIENTE_DESINSTALACION_MEDIA_REPOSITORY',
);

export interface ClienteDesinstalacionMediaRepositoryPort {
  create(
    entity: ClienteDesinstalacionMediaEntity,
  ): Promise<ClienteDesinstalacionMediaEntity>;
}
