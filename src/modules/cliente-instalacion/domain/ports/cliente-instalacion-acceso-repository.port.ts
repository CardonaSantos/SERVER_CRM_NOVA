import { ClienteInstalacionAccesoEntity } from '../entities/cliente-instalacion-acceso.entity';

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
  ): Promise<ClienteInstalacionAccesoEntity | null>;

  findByInstalacionAndAcceso(
    params: BuscarInstalacionAccesoParams,
  ): Promise<ClienteInstalacionAccesoEntity | null>;
}

export const CLIENTE_INSTALACION_ACCESO_REPOSITORY = Symbol(
  'CLIENTE_INSTALACION_ACCESO_REPOSITORY',
);
