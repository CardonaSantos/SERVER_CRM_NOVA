import { ClienteInstalacionMediaEntity } from '../../domain/entities/cliente-instalacion-media.entity';
import { ClienteInstalacionMediaRepositoryPort } from '../../domain/ports/cliente-instalacion-media-repository.port';

export class ClienteInstalacionMediaRepositoryFake
  implements ClienteInstalacionMediaRepositoryPort
{
  readonly guardadas: ClienteInstalacionMediaEntity[] = [];

  create(
    entity: ClienteInstalacionMediaEntity,
  ): Promise<ClienteInstalacionMediaEntity> {
    const guardada = ClienteInstalacionMediaEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.guardadas.length + 1,
    });

    this.guardadas.push(guardada);

    return Promise.resolve(guardada);
  }
}
