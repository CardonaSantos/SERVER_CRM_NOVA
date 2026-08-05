import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria-enums';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

export type PppoeAuditoriaInstalacionFindFilters = {
  empresaId: number;
  instalacionId: number;

  page: number;
  limit: number;

  search?: string | null;

  tipoOperacion?: TipoOperacionPppoe | null;
  estadoOperacion?: EstadoOperacionPppoe | null;

  accion?: AccionAuditoriaPppoe | null;
  origen?: OrigenOperacionPppoe | null;

  fechaDesde?: Date | null;
  fechaHasta?: Date | null;

  ordenDireccion: 'asc' | 'desc';
};

export type PppoeAuditoriaInstalacionUsuarioResumen = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
};

export type PppoeAuditoriaInstalacionRouterResumen = {
  id: number;
  nombre: string;
  host: string;
  sshPort: number;
  descripcion: string | null;
  activo: boolean;
};

export type PppoeAuditoriaInstalacionServicioResumen = {
  id: number;
  nombre: string;
  velocidad: string | null;
  precio: number;
  estado: string;
};

export type PppoeAuditoriaInstalacionPerfilResumen = {
  id: number;
  codigoPerfil: string;
  activo: boolean;
  router: PppoeAuditoriaInstalacionRouterResumen;
  servicioInternet: PppoeAuditoriaInstalacionServicioResumen;
};

export type PppoeAuditoriaInstalacionAccesoResumen = {
  id: number;
  tecnologia: string;
  metodoAutenticacion: string;
  estado: string;
  activadoEn: Date | null;
  suspendidoEn: Date | null;
  dadoDeBajaEn: Date | null;
  creadoEn: Date;
  actualizadoEn: Date;
  servicioInternet: PppoeAuditoriaInstalacionServicioResumen | null;
};

export type PppoeAuditoriaInstalacionAccesoAdministrableResumen =
  PppoeAuditoriaInstalacionAccesoResumen & {
    cuentaPppoe: {
      id: number;
      usuario: string;
      estado: EstadoCuentaPppoe;

      perfilHomologacionId: number;
      mikrotikRouterId: number;

      codigoPerfil: string;
      routerNombre: string;
    } | null;
  };

export type PppoeAuditoriaInstalacionCuentaResumen = {
  id: number;
  accesoInternetId: number;
  usuario: string;
  estado: EstadoCuentaPppoe;

  generadoEn: Date;
  secretCreadoEn: Date | null;
  activadoEn: Date | null;
  suspendidoEn: Date | null;
  eliminadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;
  ultimoError: string | null;

  accesoInternet: PppoeAuditoriaInstalacionAccesoResumen;
  perfilHomologacion: PppoeAuditoriaInstalacionPerfilResumen;
};

export type PppoeAuditoriaInstalacionEvento = {
  id: number;

  empresaId: number;
  clienteId: number | null;
  accesoInternetId: number | null;
  cuentaPppoeId: number | null;
  perfilHomologacionId: number | null;
  instalacionId: number | null;
  operacionId: number | null;
  operadorId: number | null;

  origen: OrigenOperacionPppoe;
  accion: AccionAuditoriaPppoe;

  descripcion: string;

  estadoCuentaAnterior: EstadoCuentaPppoe | null;
  estadoCuentaNuevo: EstadoCuentaPppoe | null;

  usuarioPppoeSnapshot: string | null;
  perfilCodigoSnapshot: string | null;
  operadorNombreSnapshot: string | null;

  datos: unknown | null;

  ipOrigen: string | null;
  userAgent: string | null;

  creadoEn: Date;

  operador: PppoeAuditoriaInstalacionUsuarioResumen | null;
};

export type PppoeAuditoriaInstalacionPaso = {
  id: number;
  operacionId: number;

  tipo: TipoPasoPppoe;
  orden: number;
  estado: EstadoPasoPppoe;

  comandoSanitizado: string | null;
  respuestaSanitizada: string | null;

  errorCodigo: string | null;
  errorMensaje: string | null;

  iniciadoEn: Date | null;
  finalizadoEn: Date | null;
  duracionMs: number | null;

  creadoEn: Date;
  actualizadoEn: Date;
};

export type PppoeAuditoriaInstalacionOperacionItem = {
  tipoRegistro: 'OPERACION';
  fecha: Date;

  operacion: {
    id: number;

    empresaId: number;
    cuentaPppoeId: number;
    mikrotikRouterId: number;
    perfilHomologacionId: number | null;
    instalacionId: number | null;

    reintentoDeId: number | null;
    numeroIntento: number;
    claveIdempotencia: string;

    tipo: TipoOperacionPppoe;
    origen: OrigenOperacionPppoe;
    canal: CanalOperacionPppoe;
    estado: EstadoOperacionPppoe;

    iniciadoPorId: number | null;
    reautenticadoPorId: number | null;

    requiereReautenticacion: boolean;
    reautenticacionExitosa: boolean | null;
    reautenticadoEn: Date | null;

    usuarioPppoeSnapshot: string;
    codigoPerfilSnapshot: string | null;
    routerHostSnapshot: string | null;
    routerPuertoSnapshot: number | null;

    motivo: string | null;
    resultado: unknown | null;

    errorCodigo: string | null;
    errorMensaje: string | null;

    iniciadoEn: Date | null;
    finalizadoEn: Date | null;
    canceladoEn: Date | null;
    duracionMs: number | null;

    creadoEn: Date;
    actualizadoEn: Date;
  };

  actores: {
    iniciadoPor: PppoeAuditoriaInstalacionUsuarioResumen | null;
    reautenticadoPor: PppoeAuditoriaInstalacionUsuarioResumen | null;
  };

  contexto: {
    accesoInternet: PppoeAuditoriaInstalacionAccesoResumen;
    cuentaPppoe: Omit<
      PppoeAuditoriaInstalacionCuentaResumen,
      'accesoInternet' | 'perfilHomologacion'
    >;
    router: PppoeAuditoriaInstalacionRouterResumen;
    perfilHomologacion: PppoeAuditoriaInstalacionPerfilResumen | null;
  };

  auditorias: PppoeAuditoriaInstalacionEvento[];
  pasos: PppoeAuditoriaInstalacionPaso[];
};

export type PppoeAuditoriaInstalacionAuditoriaItem = {
  tipoRegistro: 'AUDITORIA';
  fecha: Date;

  auditoria: PppoeAuditoriaInstalacionEvento;

  contexto: {
    accesoInternet: PppoeAuditoriaInstalacionAccesoResumen | null;
    cuentaPppoe: PppoeAuditoriaInstalacionCuentaResumen | null;
    perfilHomologacion: PppoeAuditoriaInstalacionPerfilResumen | null;
  };
};

export type PppoeAuditoriaInstalacionTimelineItem =
  | PppoeAuditoriaInstalacionOperacionItem
  | PppoeAuditoriaInstalacionAuditoriaItem;

export type PppoeAuditoriaInstalacionSummary = {
  instalacion: {
    id: number;
    empresaId: number;
    clienteId: number;
    estado: string;
    fechaProgramada: Date | null;
    fechaInicio: Date | null;
    fechaFinalizacion: Date | null;
    fechaActivacionServicio: Date | null;
    cliente: {
      id: number;
      nombre: string;
      apellidos: string | null;
      telefono: string | null;
    };
  };

  totalEventos: number;
  totalOperaciones: number;
  totalPasos: number;

  operacionesExitosas: number;
  operacionesFallidas: number;
  operacionesParciales: number;
  operacionesEnCurso: number;
  operacionesCanceladas: number;

  ultimaActividadEn: Date | null;

  cantidadAccesosPppoe: number;

  accesosPppoe: PppoeAuditoriaInstalacionAccesoAdministrableResumen[];

  cuentaPppoe: PppoeAuditoriaInstalacionCuentaResumen | null;
};

export type PppoeAuditoriaInstalacionPaginatedResult = {
  data: PppoeAuditoriaInstalacionTimelineItem[];

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  summary: PppoeAuditoriaInstalacionSummary;
};
