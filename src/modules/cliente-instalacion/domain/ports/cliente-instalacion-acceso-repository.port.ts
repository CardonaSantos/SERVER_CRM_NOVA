import { ClienteInstalacionAccesoEntity } from '../entities/cliente-instalacion-acceso.entity';

export const CLIENTE_INSTALACION_ACCESO_REPOSITORY = Symbol(
  'CLIENTE_INSTALACION_ACCESO_REPOSITORY',
);

export type BuscarInstalacionAccesoParams = {
  instalacionId: number;
  accesoInternetId: number;
};

export interface ClienteInstalacionAccesoRepositoryPort {
  /** Una instalación tiene a lo sumo un acceso; si ya tiene, lanza `ClienteInstalacionAccesoDuplicadoError`. */
  create(
    entity: ClienteInstalacionAccesoEntity,
  ): Promise<ClienteInstalacionAccesoEntity>;

  findByInstalacionId(
    instalacionId: number,
  ): Promise<ClienteInstalacionAccesoEntity | null>;

  /** El vínculo solo si es con ese acceso. */
  findByInstalacionAndAcceso(
    params: BuscarInstalacionAccesoParams,
  ): Promise<ClienteInstalacionAccesoEntity | null>;
}
