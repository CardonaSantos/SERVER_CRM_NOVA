import { ClienteInstalacionAccesoEntity } from '../entities/ppoe-instalacion-acceso.entity';

export type BuscarInstalacionAccesoParams = {
  instalacionId: number;
  accesoInternetId: number;
};

export interface ClienteInstalacionAccesoRepositoryPort {
  create(
    entity: ClienteInstalacionAccesoEntity,
  ): Promise<ClienteInstalacionAccesoEntity>;

  findByInstalacionId(
    instalacionId: number,
  ): Promise<ClienteInstalacionAccesoEntity[]>;

  findByInstalacionAndAcceso(
    params: BuscarInstalacionAccesoParams,
  ): Promise<ClienteInstalacionAccesoEntity | null>;
}
