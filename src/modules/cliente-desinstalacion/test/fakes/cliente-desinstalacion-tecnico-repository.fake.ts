import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';

export class ClienteDesinstalacionTecnicoRepositoryFake
  implements ClienteDesinstalacionTecnicoRepositoryPort
{
  readonly filas: ClienteDesinstalacionTecnicoEntity[] = [];
  readonly eliminados: {
    desinstalacionId: number;
    tecnicoOperacionId: number;
  }[] = [];

  create(
    entity: ClienteDesinstalacionTecnicoEntity,
  ): Promise<ClienteDesinstalacionTecnicoEntity> {
    const creada = ClienteDesinstalacionTecnicoEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.filas.length + 1,
    });

    this.filas.push(creada);

    return Promise.resolve(creada);
  }

  async createMany(
    entities: ClienteDesinstalacionTecnicoEntity[],
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    return Promise.all(entities.map((entity) => this.create(entity)));
  }

  findByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    return Promise.resolve(
      this.filas.filter((t) => t.desinstalacionId === desinstalacionId),
    );
  }

  deleteById(params: {
    desinstalacionId: number;
    tecnicoOperacionId: number;
  }): Promise<void> {
    this.eliminados.push(params);

    return Promise.resolve();
  }
}
