import { ClienteDesinstalacionMediaEntity } from '../../domain/entities/cliente-desinstalacion-media.entity';
import { ClienteDesinstalacionMediaRepositoryPort } from '../../domain/ports/cliente-desinstalacion-media-repository.port';

export class ClienteDesinstalacionMediaRepositoryFake
  implements ClienteDesinstalacionMediaRepositoryPort
{
  readonly guardadas: ClienteDesinstalacionMediaEntity[] = [];

  create(
    entity: ClienteDesinstalacionMediaEntity,
  ): Promise<ClienteDesinstalacionMediaEntity> {
    const guardada = ClienteDesinstalacionMediaEntity.fromPrimitives({
      ...entity.toPrimitives(),
      id: this.guardadas.length + 1,
    });

    this.guardadas.push(guardada);

    return Promise.resolve(guardada);
  }
}
