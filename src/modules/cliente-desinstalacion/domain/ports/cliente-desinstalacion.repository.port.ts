import { ClienteDesinstalacionTecnicoEntity } from '../entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionEntity } from '../entities/cliente-desinstalacion.entitie';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../enums/motivo-desinstalacion-cliente.enum';
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

  solicitadoPorId?: number | null;

  ejecutadoPorId?: number | null;
  motivo?: MotivoDesinstalacionCliente;

  estado?: EstadoDesinstalacionCliente | null;
  tipo?: TipoDesinstalacionCliente | null;

  fechaProgramadaDesde?: Date | null;
  fechaProgramadaHasta?: Date | null;

  fechaFinalizacionDesde?: Date | null;
  fechaFinalizacionHasta?: Date | null;
};

export type ClienteDesInstalacionPaginatedResult = {
  items: ClienteDesinstalacionDetalle[];
  total: number;
  page: number;
  limit: number;
};

export type ClienteDesinstalacionDetalle = {
  desinstalacion: ClienteDesinstalacionEntity;
  tecnicos: ClienteDesinstalacionTecnicoEntity[];
};

export type ClienteDesInstalacionPaginatedDetalleResult = {
  items: ClienteDesinstalacionDetalle[];
  total: number;
  page: number;
  limit: number;
};

export interface ClienteDesInstalacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;

  findById(id: number): Promise<ClienteDesinstalacionEntity | null>;

  findDetalleById(id: number): Promise<ClienteDesinstalacionDetalle | null>;

  findMany(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Promise<ClienteDesInstalacionPaginatedResult>;

  save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;
}
