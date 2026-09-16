import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from '../enums/pppoe-cliente-cuenta.enum';

import { FlujoActivacionCuentaPppoe } from '../enums/flujo-activacion-cuenta-pppoe.enum';

import { OrigenCuentaPppoe } from './cliente-pppoe-cuenta-listado.read-model';

export type ClientePppoeCuentaDetalleUsuarioResumen = {
  id: number;

  nombre: string;

  correo: string;

  telefono: string | null;

  activo: boolean;
};

export type ClientePppoeCuentaDetalleClienteResumen = {
  id: number;

  nombre: string;

  apellidos: string | null;

  telefono: string | null;

  dpi: string | null;

  direccion: string | null;

  estadoCliente: string;

  estadoCobranza: string;
};

export type ClientePppoeCuentaDetalleServicioResumen = {
  id: number;

  nombre: string;

  velocidad: string | null;

  precio: number;

  estado: string;
};

export type ClientePppoeCuentaDetalleAcceso = {
  id: number;

  tecnologia: string;

  metodoAutenticacion: string;

  estado: EstadoAccesoInternet;

  activadoEn: Date | null;

  suspendidoEn: Date | null;

  dadoDeBajaEn: Date | null;

  creadoEn: Date;

  actualizadoEn: Date;
};

export type ClientePppoeCuentaDetallePerfil = {
  id: number;

  mikrotikRouterId: number;

  servicioInternetId: number;

  codigoPerfil: string;

  activo: boolean;
};

export type ClientePppoeCuentaDetalleRouter = {
  id: number;

  nombre: string;

  host: string;

  sshPort: number;

  descripcion: string | null;

  activo: boolean;
};

export type ClientePppoeCuentaDetalleInstalacion = {
  /**
   * Identificador del vínculo ClienteInstalacionAcceso.
   */
  vinculoId: number;

  accion: string;

  vinculadoEn: Date;

  instalacion: {
    id: number;

    tipo: string;

    estado: string;

    fechaProgramada: Date | null;

    fechaInicio: Date | null;

    fechaFinalizacion: Date | null;

    creadoEn: Date;
  };
};

export type ClientePppoeCuentaDetalleUltimaOperacion = {
  id: number;

  tipo: TipoOperacionPppoe;

  estado: EstadoOperacionPppoe;

  reintentoDeId: number | null;

  numeroIntento: number;

  motivo: string | null;

  errorCodigo: string | null;

  errorMensaje: string | null;

  iniciadoEn: Date | null;

  finalizadoEn: Date | null;

  creadoEn: Date;

  iniciadoPor: ClientePppoeCuentaDetalleUsuarioResumen | null;
};

/**
 * Estado administrativo completo de una cuenta PPPoE.
 *
 * Este read-model nunca contiene:
 *
 * - contraseña PPPoE en texto plano;
 * - secreto cifrado;
 * - IV;
 * - auth tag;
 * - claves criptográficas.
 */
export type ClientePppoeCuentaDetalleReadModel = {
  cuentaPppoeId: number;

  empresaId: number;

  accesoInternetId: number;

  perfilHomologacionId: number;

  usuario: string;

  estadoCuenta: EstadoCuentaPppoe;

  generadoPorId: number | null;

  adoptadoPorId: number | null;

  generadoEn: Date;

  adoptadoEn: Date | null;

  secretCreadoEn: Date | null;

  activadoEn: Date | null;

  suspendidoEn: Date | null;

  eliminadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;

  actualizadoEn: Date;

  generadoPor: ClientePppoeCuentaDetalleUsuarioResumen | null;

  adoptadoPor: ClientePppoeCuentaDetalleUsuarioResumen | null;

  cliente: ClientePppoeCuentaDetalleClienteResumen;

  accesoInternet: ClientePppoeCuentaDetalleAcceso;

  servicioInternet: ClientePppoeCuentaDetalleServicioResumen | null;

  perfilHomologacion: ClientePppoeCuentaDetallePerfil;

  router: ClientePppoeCuentaDetalleRouter;

  /**
   * Origen histórico/administrativo de la cuenta.
   */
  origen: OrigenCuentaPppoe;

  /**
   * Vínculos de instalación asociados al acceso.
   *
   * El QueryRepository los devuelve de más reciente
   * a más antiguo.
   */
  instalaciones: ClientePppoeCuentaDetalleInstalacion[];

  ultimaOperacion: ClientePppoeCuentaDetalleUltimaOperacion | null;

  conteos: {
    instalaciones: number;

    operaciones: number;

    auditorias: number;
  };
};

/**
 * Capacidad administrativa sencilla.
 */
export type ClientePppoeCuentaDetalleAccion = {
  habilitada: boolean;

  /**
   * null cuando la acción puede ejecutarse.
   *
   * Cuando habilitada === false contiene una explicación
   * apta para mostrar en UI.
   */
  motivo: string | null;
};

/**
 * Describe la primera activación de una cuenta.
 *
 * La UI no debe inferir el flujo a partir de fechas,
 * estados ni existencia de instalaciones.
 *
 * Debe consumir directamente esta información.
 */
export type ClientePppoeCuentaDetalleActivacionAccion =
  ClientePppoeCuentaDetalleAccion & {
    /**
     * Orquestador que debe utilizarse.
     *
     * null significa que la cuenta no posee un flujo
     * de primera activación aplicable.
     */
    flujo: FlujoActivacionCuentaPppoe | null;

    /**
     * Obligatorio cuando flujo === INSTALACION.
     *
     * null para ALTA_MANUAL y cuentas donde
     * no exista un flujo de activación válido.
     */
    instalacionId: number | null;
  };

/**
 * Acción administrativa asociada a una operación PPPoE.
 */
export type ClientePppoeCuentaDetalleOperacionAccion =
  ClientePppoeCuentaDetalleAccion & {
    /**
     * Operación sobre la que debe ejecutarse
     * reintento o recuperación.
     */
    operacionId: number | null;
  };

/**
 * Capacidades calculadas por backend para la cuenta.
 *
 * La UI debe usar este objeto como fuente de verdad
 * en lugar de reconstruir reglas a partir de estadoCuenta.
 */
export type ClientePppoeCuentaDetalleAcciones = {
  /**
   * Primera activación contextual.
   *
   * Reemplaza el antiguo concepto "provisionar".
   */
  activar: ClientePppoeCuentaDetalleActivacionAccion;

  suspender: ClientePppoeCuentaDetalleAccion;

  reactivar: ClientePppoeCuentaDetalleAccion;

  reintentarOperacion: ClientePppoeCuentaDetalleOperacionAccion;

  recuperarOperacion: ClientePppoeCuentaDetalleOperacionAccion;
};

export type ClientePppoeCuentaDetalleResult =
  ClientePppoeCuentaDetalleReadModel & {
    acciones: ClientePppoeCuentaDetalleAcciones;
  };
