import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from '../enums/pppoe-cliente-cuenta.enum';

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
   * ClienteInstalacionAcceso.
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
 * No contiene secretos ni contraseñas.
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

  origen: OrigenCuentaPppoe;

  instalaciones: ClientePppoeCuentaDetalleInstalacion[];

  ultimaOperacion: ClientePppoeCuentaDetalleUltimaOperacion | null;

  conteos: {
    instalaciones: number;

    operaciones: number;

    auditorias: number;
  };
};

// NUEVO PARA DETALLES
export type ClientePppoeCuentaDetalleAccion = {
  habilitada: boolean;

  motivo: string | null;
};

export type ClientePppoeCuentaDetalleOperacionAccion =
  ClientePppoeCuentaDetalleAccion & {
    /**
     * Operación sobre la que debe ejecutarse
     * reintento o recuperación.
     */
    operacionId: number | null;
  };

export type ClientePppoeCuentaDetalleAcciones = {
  provisionar: ClientePppoeCuentaDetalleAccion;

  suspender: ClientePppoeCuentaDetalleAccion;

  reactivar: ClientePppoeCuentaDetalleAccion;

  reintentarOperacion: ClientePppoeCuentaDetalleOperacionAccion;

  recuperarOperacion: ClientePppoeCuentaDetalleOperacionAccion;
};

export type ClientePppoeCuentaDetalleResult =
  ClientePppoeCuentaDetalleReadModel & {
    acciones: ClientePppoeCuentaDetalleAcciones;
  };
