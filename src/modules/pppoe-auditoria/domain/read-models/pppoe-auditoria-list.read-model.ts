import { PaginatedResult } from 'src/Utils/pagination';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria-enums';

export type PppoeAuditoriaPaginatedResult =
  PaginatedResult<PppoeAuditoriaListItem>;

export type PppoeAuditoriaFindManyFilters = {
  empresaId: number;

  page: number;
  limit: number;

  search?: string | null;

  accion?: AccionAuditoriaPppoe | null;

  origen?: OrigenOperacionPppoe | null;

  clienteId?: number | null;

  instalacionId?: number | null;

  accesoInternetId?: number | null;

  cuentaPppoeId?: number | null;

  perfilHomologacionId?: number | null;

  operadorId?: number | null;

  fechaDesde?: Date | null;

  fechaHasta?: Date | null;
};

// RESUMENES TIPOS
export type PppoeAuditoriaUsuarioResumen = {
  id: number;

  nombre: string;

  correo: string;

  telefono: string | null;

  rol: string;

  activo: boolean;
};

export type PppoeAuditoriaClienteResumen = {
  id: number;

  nombre: string;

  apellidos: string | null;

  telefono: string | null;

  dpi: string | null;

  direccion: string | null;
};

export type PppoeAuditoriaServicioResumen = {
  id: number;

  nombre: string;

  velocidad: string | null;

  precio: number;

  estado: string;
};

export type PppoeAuditoriaRouterResumen = {
  id: number;

  nombre: string;

  host: string;

  sshPort: number;

  descripcion: string | null;

  activo: boolean;
};

// OTROS
import { EstadoCuentaPppoe } from '../../../pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

export type PppoeAuditoriaListItem = {
  id: number;

  empresaId: number;

  clienteId: number | null;

  accesoInternetId: number | null;

  cuentaPppoeId: number | null;

  perfilHomologacionId: number | null;

  instalacionId: number | null;

  desinstalacionId: number | null;

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

  empresa: {
    id: number;

    nombre: string;

    telefono: string | null;

    correo: string | null;
  };

  cliente: PppoeAuditoriaClienteResumen | null;

  operador: PppoeAuditoriaUsuarioResumen | null;

  accesoInternet: {
    id: number;

    tecnologia: string;

    metodoAutenticacion: string;

    estado: string;

    creadoEn: Date;

    servicioInternet: PppoeAuditoriaServicioResumen | null;
  } | null;

  cuentaPppoe: {
    id: number;

    usuario: string;

    estado: EstadoCuentaPppoe;

    generadoEn: Date;

    activadoEn: Date | null;

    suspendidoEn: Date | null;

    eliminadoEn: Date | null;

    ultimaSincronizacionEn: Date | null;

    ultimoError: string | null;
  } | null;

  perfilHomologacion: {
    id: number;

    codigoPerfil: string;

    activo: boolean;

    mikrotikRouter: PppoeAuditoriaRouterResumen;

    servicioInternet: PppoeAuditoriaServicioResumen;
  } | null;

  instalacion: {
    id: number;

    tipo: string;

    estado: string;

    fechaProgramada: Date | null;

    fechaInicio: Date | null;

    fechaFinalizacion: Date | null;
  } | null;

  desinstalacion: {
    id: number;

    tipo: string;

    motivo: string | null;

    estado: string;

    fechaProgramada: Date | null;

    fechaInicio: Date | null;

    fechaFinalizacion: Date | null;
  } | null;

  operacion: {
    id: number;

    tipo: string;

    origen: OrigenOperacionPppoe;

    estado: string;

    motivo: string | null;

    errorCodigo: string | null;

    errorMensaje: string | null;

    iniciadoEn: Date | null;

    finalizadoEn: Date | null;

    creadoEn: Date;

    mikrotikRouter: PppoeAuditoriaRouterResumen;
  } | null;
};
