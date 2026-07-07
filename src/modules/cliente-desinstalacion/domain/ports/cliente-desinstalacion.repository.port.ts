import { ClienteDesinstalacionEntity } from '../entities/cliente-desinstalacion.entitie';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

export type ClienteDesInstalacionFindManyFilters = {
  empresaId: number;

  page: number;
  limit: number;

  search?: string | null;

  clienteId?: number | null;
  servicioInternetId?: number | null;
  ticketId?: number | null;
  asesorId?: number | null;
  creadoPorId?: number | null;
  completadoPorId?: number | null;

  estado?: EstadoDesinstalacionCliente | null;
  tipo?: TipoDesinstalacionCliente | null;

  fechaProgramadaDesde?: Date | null;
  fechaProgramadaHasta?: Date | null;

  fechaFinalizacionDesde?: Date | null;
  fechaFinalizacionHasta?: Date | null;
};

export type ClienteDesInstalacionPaginatedResult = {
  items: ClienteDesinstalacionEntity[];
  total: number;
  page: number;
  limit: number;
};

export interface ClienteDesInstalacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;

  findById(id: number): Promise<ClienteDesinstalacionEntity | null>;

  findMany(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Promise<ClienteDesInstalacionPaginatedResult>;

  save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;
}
