import { ClienteInstalacionEntity } from '../entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';
import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';

// ======================================================
// USUARIOS
// ======================================================

export type ClienteInstalacionUsuarioResumen = {
  id: number;
  nombre: string;

  correo?: string | null;
  telefono?: string | null;
  avatarUrl?: string | null;

  activo: boolean;
};

// ======================================================
// CLIENTE
// ======================================================

export type ClienteInstalacionClienteResumen = {
  id: number;

  nombre: string;
  apellidos?: string | null;

  telefono?: string | null;
  dpi?: string | null;

  direccion?: string | null;
};

// ======================================================
// SERVICIO
// ======================================================

export type ClienteInstalacionServicioResumen = {
  id: number;

  nombre: string;

  velocidad?: string | null;

  precio?: number | string | null;
};

// ======================================================
// TÉCNICOS
// ======================================================

export type CrearTecnicoInstalacionInput = {
  tecnicoId: number;

  rol: RolTecnicoOperacionCliente;

  esResponsable: boolean;

  observaciones?: string | null;
};

export type ClienteInstalacionTecnicoDetalle = {
  id: number;
  instalacionId: number;

  tecnicoId?: number | null;

  rol: RolTecnicoOperacionCliente;

  esResponsable: boolean;

  tiempoMinutos?: number | null;

  observaciones?: string | null;

  tecnicoNombreSnapshot?: string | null;

  creadoEn: Date;
  actualizadoEn: Date;

  tecnico: ClienteInstalacionUsuarioResumen | null;
};

// ======================================================
// EVIDENCIAS
// ======================================================

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

    subidoPor: ClienteInstalacionUsuarioResumen | null;
  };
};

// ======================================================
// DETALLE COMPLETO
// ======================================================

export type ClienteInstalacionDetalle = {
  instalacion: ClienteInstalacionEntity;

  cliente: ClienteInstalacionClienteResumen;

  servicioInternet: ClienteInstalacionServicioResumen | null;

  participantes: {
    asesor: ClienteInstalacionUsuarioResumen | null;

    creadoPor: ClienteInstalacionUsuarioResumen | null;

    completadoPor: ClienteInstalacionUsuarioResumen | null;
  };

  tecnicos: ClienteInstalacionTecnicoDetalle[];

  evidencias: ClienteInstalacionEvidenciaDetalle[];

  conteos: {
    tecnicos: number;
    evidencias: number;
    equipos: number;
  };
};

// ======================================================
// LISTADO
// ======================================================

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

  tecnicoId?: number | null;

  estado?: EstadoInstalacionCliente | null;

  tipo?: TipoInstalacionCliente | null;

  fechaProgramadaDesde?: Date | null;

  fechaProgramadaHasta?: Date | null;

  fechaFinalizacionDesde?: Date | null;

  fechaFinalizacionHasta?: Date | null;
};

// ======================================================
// ITEM DEL LISTADO
// ======================================================

export type ClienteInstalacionListItem = {
  instalacion: ClienteInstalacionEntity;

  cliente: {
    id: number;
    nombre: string;
    apellidos: string | null;
    telefono: string | null;
    dpi: string | null;
    direccion: string | null;
  };

  servicioInternet: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number | null;
  } | null;

  asesor: ClienteInstalacionUsuarioResumen | null;

  tecnicoResponsable: {
    asignacionId: number;
    tecnicoId: number | null;
    nombre: string;
    avatarUrl: string | null;
  } | null;

  conteos: {
    tecnicos: number;
    evidencias: number;
    equipos: number;
  };
};

// ======================================================
// PAGINACIÓN
// ======================================================

export type ClienteInstalacionPaginatedResult = {
  items: ClienteInstalacionListItem[];

  total: number;

  page: number;

  limit: number;

  totalPages: number;
};

// ======================================================
// REPOSITORY PORT
// ======================================================

export interface ClienteInstalacionRepositoryPort {
  create(
    entity: ClienteInstalacionEntity,
    tecnicos?: CrearTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity>;

  findById(params: { id: number }): Promise<ClienteInstalacionEntity | null>;

  findDetailById(params: {
    id: number;
  }): Promise<ClienteInstalacionDetalle | null>;

  findMany(
    filters: ClienteInstalacionFindManyFilters,
  ): Promise<ClienteInstalacionPaginatedResult>;

  save(entity: ClienteInstalacionEntity): Promise<ClienteInstalacionEntity>;

  deleteAll(): Promise<any>;
}
