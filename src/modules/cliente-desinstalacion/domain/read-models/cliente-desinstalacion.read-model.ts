import { ClienteDesinstalacionEntity } from '../entities/cliente-desinstalacion.entitie';

/**
 * Usuario utilizado en relaciones de lectura y auditoría.
 *
 * Nunca incluye contraseña ni información de autenticación.
 */
export type UsuarioDesinstalacionResumen = {
  id: number;

  nombre: string;

  correo: string;

  telefono: string | null;

  activo: boolean;

  avatarUrl: string | null;
};

export type ClienteDesinstalacionClienteResumen = {
  id: number;

  nombre: string;

  apellidos: string | null;

  telefono: string | null;

  dpi: string | null;

  direccion: string | null;
};

export type ClienteDesinstalacionServicioResumen = {
  id: number;

  nombre: string;

  velocidad: string | null;

  precio: number;
};

export type ClienteDesinstalacionTicketResumen = {
  id: number;

  titulo: string | null;

  descripcion: string | null;

  estado: string;

  prioridad: string;

  fechaApertura: Date;

  fechaCierre: Date | null;
};

export type ClienteDesinstalacionCuentaPppoeResumen = {
  id: number;

  usuario: string;

  estado: string;

  perfilHomologacionId: number;

  generadoEn: Date;

  secretCreadoEn: Date | null;

  activadoEn: Date | null;

  suspendidoEn: Date | null;

  eliminadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;
};

export type ClienteDesinstalacionAccesoResumen = {
  id: number;

  clienteId: number;

  servicioInternetId: number | null;

  tecnologia: string;

  metodoAutenticacion: string;

  estado: string;

  activadoEn: Date | null;

  suspendidoEn: Date | null;

  dadoDeBajaEn: Date | null;

  creadoEn: Date;

  actualizadoEn: Date;

  cuentaPppoe: ClienteDesinstalacionCuentaPppoeResumen | null;
};

export type ClienteDesinstalacionTecnicoDetalle = {
  id: number;

  desinstalacionId: number;

  tecnicoId: number | null;

  rol: string;

  esResponsable: boolean;

  tiempoMinutos: number | null;

  observaciones: string | null;

  tecnicoNombreSnapshot: string | null;

  creadoEn: Date;

  actualizadoEn: Date;

  tecnico: UsuarioDesinstalacionResumen | null;
};

export type ClienteDesinstalacionTecnicoResponsableResumen = {
  asignacionId: number;

  tecnicoId: number | null;

  nombre: string;

  avatarUrl: string | null;
};

export type ClienteDesinstalacionEvidenciaDetalle = {
  id: number;

  desinstalacionId: number;

  mediaId: number;

  tipo: string;

  descripcion: string | null;

  orden: number;

  creadoEn: Date;

  media: {
    id: number;

    categoria: string;

    tipo: string;

    estado: string;

    cdnUrl: string | null;

    mimeType: string | null;

    extension: string | null;

    /**
     * Se devuelve como string para evitar errores
     * al serializar BigInt a JSON.
     */
    tamanioBytes: string | null;

    ancho: number | null;

    alto: number | null;

    titulo: string | null;

    descripcion: string | null;

    tomadoEn: Date | null;

    creadoEn: Date;
  };
};

export type ClienteDesinstalacionEquipoDetalle = {
  id: number;

  desinstalacionId: number;

  productoId: number | null;

  serialProductoId: number | null;

  movimientoInventarioId: number | null;

  bodegaDestinoId: number | null;

  accesoEquipoId: number | null;

  descripcion: string | null;

  cantidad: number;

  estadoRetiro: string;

  costoRecuperacion: number;

  serialSnapshot: string | null;

  notas: string | null;

  creadoEn: Date;

  actualizadoEn: Date;

  producto: {
    id: number;

    nombre: string;
  } | null;

  serialProducto: {
    id: number;

    serial: string;
  } | null;

  bodegaDestino: {
    id: number;

    nombre: string;
  } | null;
};

export type ClienteDesinstalacionAutorizacionDetalle = {
  id: number;

  estado: string;

  motivoSolicitud: string | null;

  comentarioAutorizador: string | null;

  fechaSolicitud: Date;

  fechaRespuesta: Date | null;

  solicitadoPor: UsuarioDesinstalacionResumen | null;

  autorizadoPor: UsuarioDesinstalacionResumen | null;
};

export type ClienteDesinstalacionOperacionPppoeDetalle = {
  id: number;

  cuentaPppoeId: number;

  mikrotikRouterId: number;

  tipo: string;

  origen: string;

  estado: string;

  iniciadoPorId: number | null;

  reautenticadoPorId: number | null;

  requiereReautenticacion: boolean;

  reautenticacionExitosa: boolean | null;

  reautenticadoEn: Date | null;

  motivo: string | null;

  errorCodigo: string | null;

  errorMensaje: string | null;

  iniciadoEn: Date | null;

  finalizadoEn: Date | null;

  creadoEn: Date;

  actualizadoEn: Date;

  iniciadoPor: UsuarioDesinstalacionResumen | null;

  reautenticadoPor: UsuarioDesinstalacionResumen | null;

  pasos: Array<{
    id: number;

    tipo: string;

    orden: number;

    estado: string;

    errorCodigo: string | null;

    errorMensaje: string | null;

    iniciadoEn: Date | null;

    finalizadoEn: Date | null;

    duracionMs: number | null;
  }>;
};

export type ClienteDesinstalacionAuditoriaPppoeDetalle = {
  id: number;

  operacionId: number | null;

  cuentaPppoeId: number | null;

  accesoInternetId: number | null;

  perfilHomologacionId: number | null;

  operadorId: number | null;

  origen: string;

  accion: string;

  descripcion: string;

  estadoCuentaAnterior: string | null;

  estadoCuentaNuevo: string | null;

  usuarioPppoeSnapshot: string | null;

  perfilCodigoSnapshot: string | null;

  datos: unknown;

  ipOrigen: string | null;

  userAgent: string | null;

  creadoEn: Date;

  operador: UsuarioDesinstalacionResumen | null;
};

export type ClienteDesinstalacionGastoDetalle = {
  id: number;

  tipoGasto: string;

  subtipo: string | null;

  descripcion: string | null;

  montoTotal: number;

  esRecuperable: boolean;

  estado: string;

  fechaGasto: Date;

  aprobadoEn: Date | null;

  registradoPor: UsuarioDesinstalacionResumen | null;

  aprobadoPor: UsuarioDesinstalacionResumen | null;

  evidencia: {
    id: number;

    cdnUrl: string | null;

    mimeType: string | null;
  } | null;
};

export type ClienteDesinstalacionConteos = {
  tecnicos: number;

  evidencias: number;

  equipos: number;

  gastosOperativos: number;

  autorizaciones: number;

  operacionesPppoe: number;

  auditoriasPppoe: number;
};

/**
 * Modelo enriquecido usado por el listado paginado.
 *
 * Evita cargar colecciones completas, pero conserva
 * las relaciones relevantes para identificar y auditar
 * rápidamente el registro.
 */
export type ClienteDesinstalacionListadoItem = {
  desinstalacion: ClienteDesinstalacionEntity;

  cliente: ClienteDesinstalacionClienteResumen;

  servicioInternet: ClienteDesinstalacionServicioResumen | null;

  ticket: ClienteDesinstalacionTicketResumen | null;

  solicitadoPor: UsuarioDesinstalacionResumen | null;

  ejecutadoPor: UsuarioDesinstalacionResumen | null;

  creadoPor: UsuarioDesinstalacionResumen | null;

  accesoInternet: ClienteDesinstalacionAccesoResumen | null;

  tecnicoResponsable: ClienteDesinstalacionTecnicoResponsableResumen | null;

  ultimaAutorizacion: ClienteDesinstalacionAutorizacionDetalle | null;

  ultimaOperacionPppoe: ClienteDesinstalacionOperacionPppoeDetalle | null;

  conteos: ClienteDesinstalacionConteos;
};

/**
 * Modelo completo utilizado por GET /:id.
 */
export type ClienteDesinstalacionDetalle = ClienteDesinstalacionListadoItem & {
  tecnicos: ClienteDesinstalacionTecnicoDetalle[];

  evidencias: ClienteDesinstalacionEvidenciaDetalle[];

  equipos: ClienteDesinstalacionEquipoDetalle[];

  gastosOperativos: ClienteDesinstalacionGastoDetalle[];

  autorizaciones: ClienteDesinstalacionAutorizacionDetalle[];

  operacionesPppoe: ClienteDesinstalacionOperacionPppoeDetalle[];

  auditoriasPppoe: ClienteDesinstalacionAuditoriaPppoeDetalle[];
};
