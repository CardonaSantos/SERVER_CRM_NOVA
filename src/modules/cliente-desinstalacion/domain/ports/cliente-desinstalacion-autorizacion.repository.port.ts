import { ClienteDesinstalacionAutorizacionEntity } from '../entities/cliente-desintalacion-autorizacion.entitie';

export type AutorizacionDesinstalacionPendiente = {
  autorizacion: ClienteDesinstalacionAutorizacionEntity;
  desinstalacion: {
    id: number;
    clienteId: number;
    servicioInternetId?: number | null;
    tipo: string;
    motivo?: string | null;
    estado: string;
    fechaProgramada?: Date | null;
    observaciones?: string | null;
  };
};

export interface ClienteDesinstalacionAutorizacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity>;

  findById(id: number): Promise<ClienteDesinstalacionAutorizacionEntity | null>;

  findPendientes(): Promise<AutorizacionDesinstalacionPendiente[]>;

  save(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity>;
}
