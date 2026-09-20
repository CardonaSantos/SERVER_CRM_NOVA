import { ClienteDesinstalacionAutorizacionEntity } from '../entities/cliente-desintalacion-autorizacion.entitie';

export type AutorizacionDesinstalacionPendiente = {
  autorizacion: ClienteDesinstalacionAutorizacionEntity;

  solicitadoPor: {
    id: number;
    nombre: string;
  } | null;

  desinstalacion: {
    id: number;

    clienteId: number;

    servicioInternetId: number | null;

    tipo: string;

    motivo: string | null;

    estado: string;

    fechaProgramada: Date | null;

    observaciones: string | null;

    cliente: {
      id: number;

      nombre: string;

      apellidos: string | null;

      telefono: string | null;

      direccion: string | null;
    };

    servicioInternet: {
      id: number;

      nombre: string;

      velocidad: string | null;

      precio: number;
    } | null;
  };
};

export type BuscarAutorizacionesPendientesParams = {
  page: number;

  limit: number;
};

export type AutorizacionesPendientesPaginatedResult = {
  data: AutorizacionDesinstalacionPendiente[];

  meta: {
    total: number;

    page: number;

    limit: number;

    totalPages: number;
  };
};

export interface ClienteDesinstalacionAutorizacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity>;

  findById(id: number): Promise<ClienteDesinstalacionAutorizacionEntity | null>;

  findPendienteByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null>;

  findPendientes(
    params: BuscarAutorizacionesPendientesParams,
  ): Promise<AutorizacionesPendientesPaginatedResult>;

  save(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity>;

  findUltimaByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null>;
}
