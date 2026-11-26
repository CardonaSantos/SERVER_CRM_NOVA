import { ClienteInstalacionMediaEntity } from '../entities/cliente-instalacion-media.entity';

export const CLIENTE_INSTALACION_MEDIA_REPOSITORY = Symbol(
  'CLIENTE_INSTALACION_MEDIA_REPOSITORY',
);

export interface ClienteInstalacionMediaRepositoryPort {
  create(
    entity: ClienteInstalacionMediaEntity,
  ): Promise<ClienteInstalacionMediaEntity>;
}
