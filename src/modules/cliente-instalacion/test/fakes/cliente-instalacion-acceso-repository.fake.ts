import { ClienteInstalacionAccesoEntity } from '../../domain/entities/cliente-instalacion-acceso.entity';
import { ClienteInstalacionAccesoDuplicadoError } from '../../domain/errors/cliente-instalacion.errors';
import {
  BuscarInstalacionAccesoParams,
  ClienteInstalacionAccesoRepositoryPort,
} from '../../domain/ports/cliente-instalacion-acceso-repository.port';

/** Vínculos instalación ↔ acceso en memoria; una instalación tiene a lo sumo uno. */
export class ClienteInstalacionAccesoRepositoryFake
  implements ClienteInstalacionAccesoRepositoryPort
{
  readonly vinculos = new Map<number, ClienteInstalacionAccesoEntity>();
  private siguienteId = 1;

  create(
    entity: ClienteInstalacionAccesoEntity,
  ): Promise<ClienteInstalacionAccesoEntity> {
    if (this.vinculos.has(entity.instalacionId)) {
      throw new ClienteInstalacionAccesoDuplicadoError();
    }

    const guardado = ClienteInstalacionAccesoEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });

    this.vinculos.set(guardado.instalacionId, guardado);

    return Promise.resolve(guardado);
  }

  findByInstalacionId(
    instalacionId: number,
  ): Promise<ClienteInstalacionAccesoEntity | null> {
    return Promise.resolve(this.vinculos.get(instalacionId) ?? null);
  }

  async findByInstalacionAndAcceso(
    params: BuscarInstalacionAccesoParams,
  ): Promise<ClienteInstalacionAccesoEntity | null> {
    const vinculo = await this.findByInstalacionId(params.instalacionId);

    return vinculo && vinculo.accesoInternetId === params.accesoInternetId
      ? vinculo
      : null;
  }
}
