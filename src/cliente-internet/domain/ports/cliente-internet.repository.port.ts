import { ClienteInternetEntity } from '../entities/cliente-internet.entity';

export const CLIENTE_INTERNET_REPOSITORY = Symbol(
  'CLIENTE_INTERNET_REPOSITORY',
);

/** Puerto de escritura mínimo. Consultas pesadas pertenecen a puertos Query separados.
 * No permite guardar estado operativo ni financiero mediante una edición ordinaria.
 */
export interface ClienteInternetRepositoryPort {
  findById(id: number): Promise<ClienteInternetEntity | null>;
  create(entity: ClienteInternetEntity): Promise<ClienteInternetEntity>;
  actualizarPerfil(
    entity: ClienteInternetEntity,
  ): Promise<ClienteInternetEntity>;
}
