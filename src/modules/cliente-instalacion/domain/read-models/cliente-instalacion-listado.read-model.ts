import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';
import { ClienteInstalacionResumen } from './cliente-instalacion-resumen.read-model';

export type ClienteInstalacionUsuarioResumen = {
  id: number;
  nombre: string;

  correo?: string | null;
  telefono?: string | null;
  avatarUrl?: string | null;

  activo: boolean;
};

export type ClienteInstalacionClienteResumen = {
  id: number;

  nombre: string;
  apellidos?: string | null;

  telefono?: string | null;
  dpi?: string | null;

  direccion?: string | null;
};

export type ClienteInstalacionServicioResumen = {
  id: number;

  nombre: string;

  velocidad?: string | null;

  precio?: number | string | null;
};

export type ClienteInstalacionMiAsignacionResumen = {
  asignacionId: number;

  tecnicoId: number | null;

  rol: string;

  esResponsable: boolean;
};

export type ClienteInstalacionAssignedListItem = ClienteInstalacionListItem & {
  /**
   * Asignación correspondiente al técnico autenticado.
   */
  miAsignacion: ClienteInstalacionMiAsignacionResumen;
};

export type ClienteInstalacionAsignadasFiltros = {
  /** Quien consulta: sale del actor autenticado, nunca de la petición. */
  tecnicoId: number;

  search: string | null;

  estado: EstadoInstalacionCliente | null;

  fechaProgramadaDesde: Date | null;
  fechaProgramadaHasta: Date | null;
};

export type ClienteInstalacionFiltros = {
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

export type ClienteInstalacionListItem = {
  instalacion: ClienteInstalacionResumen;

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
