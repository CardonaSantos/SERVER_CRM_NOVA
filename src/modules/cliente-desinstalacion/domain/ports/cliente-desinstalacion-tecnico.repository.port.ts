import { ClienteDesinstalacionTecnicoEntity } from '../entities/cliente-desinstalacion-tecnico.entity';

export interface ClienteDesinstalacionTecnicoRepositoryPort {
  create(
    entity: ClienteDesinstalacionTecnicoEntity,
  ): Promise<ClienteDesinstalacionTecnicoEntity>;

  createMany(
    entities: ClienteDesinstalacionTecnicoEntity[],
  ): Promise<ClienteDesinstalacionTecnicoEntity[]>;

  findByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionTecnicoEntity[]>;

  deleteById(params: {
    desinstalacionId: number;
    tecnicoOperacionId: number;
  }): Promise<void>;
}
