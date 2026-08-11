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

export type ActualizarTecnicoInstalacionInput = {
  tecnicoId: number;

  rol: RolTecnicoOperacionCliente;

  esResponsable: boolean;

  tiempoMinutos?: number | null;

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

  ticket: ClienteInstalacionTicketResumen | null;

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

export type ClienteInstalacionAssignedFilters = {
  /**
   * Se obtiene del JWT.
   */
  tecnicoId: number;

  page: number;
  limit: number;

  search: string | null;

  estado: EstadoInstalacionCliente | null;

  fechaProgramadaDesde: Date | null;
  fechaProgramadaHasta: Date | null;
};

export type ClienteInstalacionAssignedPaginatedResult = {
  items: ClienteInstalacionAssignedListItem[];

  total: number;

  page: number;
  limit: number;

  totalPages: number;
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

export type ClienteInstalacionTicketResumen = {
  id: number;

  titulo: string | null;

  estado: string;
  prioridad: string;

  fechaApertura: Date;
  fechaCierre: Date | null;
};

// DETALLE INSTALACION TECNICO
export type InstalacionTecnicaParticipante = {
  asignacionId: number;

  tecnicoId: number | null;

  nombre: string;

  avatarUrl: string | null;

  rol: string;

  esResponsable: boolean;

  tiempoMinutos: number | null;

  observaciones: string | null;
};

export type InstalacionTecnicaEvidencia = {
  evidenciaId: number;

  mediaId: number;

  tipo: string;

  descripcion: string | null;

  orden: number;

  url: string | null;

  mimeType: string | null;

  titulo: string | null;

  creadoEn: Date;
};

export type InstalacionTecnicaEquipo = {
  id: number;

  productoId: number | null;

  productoNombre: string | null;

  serialProductoId: number | null;

  serial: string | null;

  descripcion: string | null;

  cantidad: number;

  esPrincipal: boolean;

  notas: string | null;
};

export type InstalacionTecnicaConfiguracion = {
  id: number;

  potenciaOpticaRxDbm: number | null;

  senalInalambricaDbm: number | null;

  ssid: string | null;

  /**
   * No devuelve contrasenaWifiProtegida.
   */
  tieneContrasenaWifi: boolean;

  bandaWifi: string | null;

  canal: number | null;

  anchoCanalMhz: number | null;

  ipv4: string | null;

  ipv6: string | null;

  gateway: string | null;

  dnsPrimario: string | null;

  dnsSecundario: string | null;

  observaciones: string | null;
};

export type InstalacionTecnicaCuentaPppoe = {
  id: number;

  usuario: string;

  estado: string;

  perfilHomologacionId: number;

  codigoPerfil: string;

  mikrotikRouterId: number;

  routerNombre: string;

  generadoEn: Date;

  activadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;
};

export type InstalacionTecnicaAcceso = {
  vinculoId: number;

  accion: string;

  accesoInternetId: number;

  tecnologia: string;

  metodoAutenticacion: string;

  estado: string;

  servicioInternetId: number | null;

  configuracionTecnica: InstalacionTecnicaConfiguracion | null;

  cuentaPppoe: InstalacionTecnicaCuentaPppoe | null;
};

export type InstalacionTecnicaMiAsignacion = {
  asignacionId: number;

  tecnicoId: number | null;

  rol: string;

  esResponsable: boolean;
};

export type ClienteInstalacionTechnicalDetail = {
  instalacion: ClienteInstalacionEntity;

  cliente: {
    id: number;

    nombre: string;

    apellidos: string | null;

    telefono: string | null;

    telefonoReferencia: string | null;

    dpi: string | null;

    direccion: string | null;

    observaciones: string | null;

    municipio: string | null;
    departamento: string | null;

    sector: string | null;
  };

  servicioInternet: {
    id: number;

    nombre: string;

    velocidad: string | null;

    precio: number | null;
  } | null;

  /**
   * Es solo contexto visual.
   * No concede ni limita permisos.
   */
  miAsignacion: InstalacionTecnicaMiAsignacion | null;

  participantes: InstalacionTecnicaParticipante[];

  accesos: InstalacionTecnicaAcceso[];

  evidencias: InstalacionTecnicaEvidencia[];

  equipos: InstalacionTecnicaEquipo[];
};

export type InstalacionTecnicaAccion = {
  habilitada: boolean;

  motivo: string | null;
};

export type InstalacionTecnicaAcciones = {
  reprogramar: InstalacionTecnicaAccion;

  iniciar: InstalacionTecnicaAccion;

  completar: InstalacionTecnicaAccion;

  cancelar: InstalacionTecnicaAccion;

  subirEvidencia: InstalacionTecnicaAccion;

  revelarCredenciales: InstalacionTecnicaAccion;

  reintentarPrealta: InstalacionTecnicaAccion;
};

export type ClienteInstalacionTechnicalResult =
  ClienteInstalacionTechnicalDetail & {
    acciones: InstalacionTecnicaAcciones;
  };

export type BuscarInstalacionAsignadaTecnicoParams = {
  instalacionId: number;

  /**
   * Usuario autenticado obtenido del JWT.
   */
  tecnicoId: number;

  /**
   * Empresa obtenida del JWT.
   */
  empresaId: number;
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

  save(
    entity: ClienteInstalacionEntity,
    tecnicos?: ActualizarTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity>;

  findAssignedToTechnician(
    filters: ClienteInstalacionAssignedFilters,
  ): Promise<ClienteInstalacionAssignedPaginatedResult>;

  findTechnicalDetailById(
    instalacionId: number,
    actorId: number,
  ): Promise<ClienteInstalacionTechnicalDetail | null>;

  findByIdAssignedToTechnician(
    params: BuscarInstalacionAsignadaTecnicoParams,
  ): Promise<ClienteInstalacionEntity | null>;

  deleteAll(): Promise<any>;
}
