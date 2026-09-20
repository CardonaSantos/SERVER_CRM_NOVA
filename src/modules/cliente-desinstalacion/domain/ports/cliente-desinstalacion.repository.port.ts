import { ClienteDesinstalacionEntity } from '../entities/cliente-desinstalacion.entitie';

import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';

import { MotivoDesinstalacionCliente } from '../enums/motivo-desinstalacion-cliente.enum';

import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

import {
  ClienteDesinstalacionDetalle,
  ClienteDesinstalacionListadoItem,
} from '../read-models/cliente-desinstalacion.read-model';

export type ClienteDesInstalacionFindManyFilters = {
  /**
   * Puede omitirse porque actualmente existe una sola
   * empresa por base de datos.
   */
  empresaId?: number | null;

  page: number;

  limit: number;

  search?: string | null;

  clienteId?: number | null;

  servicioInternetId?: number | null;

  ticketId?: number | null;

  accesoInternetId?: number | null;

  creadoPorId?: number | null;

  solicitadoPorId?: number | null;

  ejecutadoPorId?: number | null;

  motivo?: MotivoDesinstalacionCliente | null;

  estado?: EstadoDesinstalacionCliente | null;

  tipo?: TipoDesinstalacionCliente | null;

  fechaProgramadaDesde?: Date | null;

  fechaProgramadaHasta?: Date | null;

  fechaFinalizacionDesde?: Date | null;

  fechaFinalizacionHasta?: Date | null;
};

export type ClienteDesInstalacionPaginatedResult = {
  data: ClienteDesinstalacionListadoItem[];

  meta: {
    total: number;

    page: number;

    limit: number;

    totalPages: number;
  };
};

export interface ClienteDesInstalacionRepositoryPort {
  create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;

  /**
   * Consulta mínima utilizada por comandos y transiciones.
   */
  findById(id: number): Promise<ClienteDesinstalacionEntity | null>;

  /**
   * Consulta enriquecida utilizada por presentación.
   */
  findDetalleById(id: number): Promise<ClienteDesinstalacionDetalle | null>;

  findMany(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Promise<ClienteDesInstalacionPaginatedResult>;

  save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity>;
}
