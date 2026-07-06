import { ClienteInstalacionEntity } from '../entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';

export type ClienteInstalacionFindManyFilters = {
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

  estado?: EstadoInstalacionCliente | null;
  tipo?: TipoInstalacionCliente | null;

  fechaProgramadaDesde?: Date | null;
  fechaProgramadaHasta?: Date | null;

  fechaFinalizacionDesde?: Date | null;
  fechaFinalizacionHasta?: Date | null;
};

export type ClienteInstalacionPaginatedResult = {
  items: ClienteInstalacionEntity[];
  total: number;
  page: number;
  limit: number;
};

export interface ClienteInstalacionRepositoryPort {
  create(entity: ClienteInstalacionEntity): Promise<ClienteInstalacionEntity>;

  findById(params: { id: number }): Promise<ClienteInstalacionEntity | null>;

  findMany(
    filters: ClienteInstalacionFindManyFilters,
  ): Promise<ClienteInstalacionPaginatedResult>;

  save(entity: ClienteInstalacionEntity): Promise<ClienteInstalacionEntity>;
  //   delete(id: number): Promise<null>;
}
