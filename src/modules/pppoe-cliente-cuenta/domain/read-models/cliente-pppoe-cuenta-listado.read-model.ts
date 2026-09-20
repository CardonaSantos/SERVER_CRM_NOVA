import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { EstadoCuentaPppoe } from '../enums/pppoe-cliente-cuenta.enum';
import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';
import { PaginatedResult } from 'src/Utils/pagination';

export enum OrigenCuentaPppoe {
  /**
   * Cuenta generada durante el flujo
   * de una instalación.
   */
  INSTALACION = 'INSTALACION',

  /**
   * Cuenta creada manualmente desde CRM
   * y posteriormente provisionada en MikroTik.
   */
  ALTA_MANUAL = 'ALTA_MANUAL',

  /**
   * Secret que ya existía en MikroTik
   * antes de ser incorporado al CRM.
   */
  EXTERNA_ADOPTADA = 'EXTERNA_ADOPTADA',
}

export type ClientePppoeCuentaUltimaOperacionResumen = {
  id: number;

  tipo: TipoOperacionPppoe;

  estado: EstadoOperacionPppoe;

  creadoEn: Date;

  finalizadoEn: Date | null;
};

/**
 * Datos mínimos del cliente necesarios para
 * identificar la cuenta PPPoE desde administración.
 */
export type ClientePppoeCuentaClienteResumen = {
  id: number;

  nombre: string;

  apellidos: string | null;

  telefono: string | null;

  dpi: string | null;
};

/**
 * Servicio de internet asociado al acceso.
 *
 * Puede ser null para tolerar registros históricos
 * o accesos antiguos que no tengan el servicio
 * informado directamente.
 */
export type ClientePppoeCuentaServicioResumen = {
  id: number;

  nombre: string;

  velocidad: string | null;

  precio: number | null;
};

/**
 * Perfil RouterOS resuelto mediante homologación.
 */
export type ClientePppoeCuentaPerfilResumen = {
  id: number;

  codigoPerfil: string;
};

/**
 * Router MikroTik al que pertenece la homologación
 * utilizada por la cuenta.
 */
export type ClientePppoeCuentaRouterResumen = {
  id: number;

  nombre: string;
};

/**
 * Item administrativo de una cuenta PPPoE.
 *
 * IMPORTANTE:
 *
 * Este read-model nunca expone:
 *
 * - secretoCifrado;
 * - secretoIv;
 * - secretoAuthTag;
 * - versionClave;
 * - contraseña PPPoE.
 *
 * La contraseña se revelará exclusivamente mediante
 * un endpoint explícito y auditado.
 */
export type ClientePppoeCuentaListItem = {
  /**
   * Identificador principal para navegar al detalle:
   *
   * /pppoe-cuentas/:cuentaPppoeId
   */
  cuentaPppoeId: number;

  /**
   * Acceso de internet al que pertenece la cuenta.
   */
  accesoInternetId: number;

  /**
   * El usuario PPPoE no es material criptográfico
   * y puede mostrarse normalmente en administración.
   */
  usuario: string;

  estadoCuenta: EstadoCuentaPppoe;

  estadoAcceso: EstadoAccesoInternet;

  /**
   * Fechas útiles para administración y diagnóstico.
   */
  generadoEn: Date;

  secretCreadoEn: Date | null;

  activadoEn: Date | null;

  suspendidoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  /**
   * Último error conocido de la cuenta.
   *
   * Nos permitirá posteriormente mostrar un badge,
   * warning o acceso al historial de operaciones.
   */
  ultimoError: string | null;

  cliente: ClientePppoeCuentaClienteResumen;

  servicioInternet: ClientePppoeCuentaServicioResumen | null;

  perfilHomologacion: ClientePppoeCuentaPerfilResumen;

  router: ClientePppoeCuentaRouterResumen;

  /**
   * Origen administrativo de la cuenta.
   *
   * Se deriva así:
   *
   * adoptadoEn != null
   *   -> EXTERNA_ADOPTADA
   *
   * instalación vinculada
   *   -> INSTALACION
   *
   * de lo contrario
   *   -> ALTA_MANUAL
   */
  origen: OrigenCuentaPppoe;

  /**
   * Última operación técnica conocida.
   */
  ultimaOperacion: ClientePppoeCuentaUltimaOperacionResumen | null;
};

/**
 * Filtros internos del listado.
 *
 * empresaId nunca deberá llegar desde el query HTTP.
 * Se obtendrá del JWT y el controller lo incorporará
 * antes de ejecutar el caso de uso.
 */
export type ClientePppoeCuentaFindManyFilters = {
  empresaId: number;

  page: number;

  limit: number;

  origen?: OrigenCuentaPppoe | null;
  /**
   * Buscará posteriormente por datos como:
   *
   * - usuario PPPoE;
   * - nombre/apellidos;
   * - teléfono;
   * - DPI;
   * - código de perfil.
   */
  search?: string | null;

  clienteId?: number | null;

  servicioInternetId?: number | null;

  mikrotikRouterId?: number | null;

  perfilHomologacionId?: number | null;

  estadoCuenta?: EstadoCuentaPppoe | null;

  estadoAcceso?: EstadoAccesoInternet | null;
};

export type ClientePppoeCuentaPaginatedResult =
  PaginatedResult<ClientePppoeCuentaListItem>;
