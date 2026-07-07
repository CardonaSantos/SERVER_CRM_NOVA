import { ClienteInstalacionEntity } from '../entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';

// ADICIONALES
export type ClienteInstalacionEvidenciaDetalle = {
  id: number;
  instalacionId: number;
  mediaId: number;
  tipo: TipoEvidenciaClienteOperacion;
  descripcion?: string | null;
  orden: number;
  creadoEn: Date;

  media: {
    id: number;
    cdnUrl?: string | null;
    key: string;
    mimeType?: string | null;
    extension?: string | null;
    tamanioBytes?: bigint | number | string | null;
  };
};

export type ClienteInstalacionDetalle = {
  instalacion: ClienteInstalacionEntity;
  evidencias: ClienteInstalacionEvidenciaDetalle[];
};
//
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

  findDetailById(params: {
    id: number;
  }): Promise<ClienteInstalacionDetalle | null>;

  findMany(
    filters: ClienteInstalacionFindManyFilters,
  ): Promise<ClienteInstalacionPaginatedResult>;

  save(entity: ClienteInstalacionEntity): Promise<ClienteInstalacionEntity>;
}
