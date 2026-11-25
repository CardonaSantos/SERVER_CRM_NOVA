import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
import {
  ClientePppoeCuentaReadModel,
  EstadoCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  PppoeOperacionPasoReadModel,
  PppoeOperacionReadModel,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

/** Fechas fijas para que las pruebas no dependan del reloj real. */
export const INICIO = new Date('2026-11-25T15:00:00.000Z');

type DatosOperacion = Omit<
  PppoeOperacionReadModel,
  | 'estaPendiente'
  | 'estaAutorizada'
  | 'estaEjecutando'
  | 'estaEnCurso'
  | 'esTerminal'
  | 'puedeReintentarse'
  | 'esReintento'
>;

/** Recalcula las preguntas de estado igual que la entidad de pppoe-operacion. */
export function conEstadoOperacion(d: DatosOperacion): PppoeOperacionReadModel {
  const E = EstadoOperacionPppoe;
  return {
    ...d,
    estaPendiente: d.estado === E.PENDIENTE,
    estaAutorizada: d.estado === E.AUTORIZADA,
    estaEjecutando: d.estado === E.EJECUTANDO,
    estaEnCurso: [E.PENDIENTE, E.AUTORIZADA, E.EJECUTANDO].includes(d.estado),
    esTerminal: [E.EXITOSA, E.PARCIAL, E.FALLIDA, E.CANCELADA].includes(
      d.estado,
    ),
    puedeReintentarse: [E.PARCIAL, E.FALLIDA].includes(d.estado),
    esReintento: d.reintentoDeId !== null || d.numeroIntento > 1,
  };
}

export function operacion(
  datos: Partial<DatosOperacion> = {},
): PppoeOperacionReadModel {
  return conEstadoOperacion({
    id: 10,
    empresaId: 1,
    cuentaPppoeId: 20,
    mikrotikRouterId: 3,
    perfilHomologacionId: 4,
    instalacionId: null,
    desinstalacionId: null,
    reintentoDeId: null,
    numeroIntento: 1,
    claveIdempotencia: 'clave-1',
    tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO,
    origen: OrigenOperacionPppoe.OPERADOR,
    canal: CanalOperacionPppoe.SSH,
    estado: EstadoOperacionPppoe.EJECUTANDO,
    iniciadoPorId: 7,
    reautenticadoPorId: null,
    requiereReautenticacion: false,
    reautenticacionExitosa: null,
    reautenticadoEn: null,
    usuarioPppoeSnapshot: 'cliente.prueba',
    codigoPerfilSnapshot: 'PLAN-10',
    routerHostSnapshot: null,
    routerPuertoSnapshot: null,
    motivo: null,
    resultado: null,
    errorCodigo: null,
    errorMensaje: null,
    iniciadoEn: INICIO,
    finalizadoEn: null,
    canceladoEn: null,
    duracionMs: null,
    creadoEn: INICIO,
    actualizadoEn: INICIO,
    ...datos,
  });
}

type DatosPaso = Omit<
  PppoeOperacionPasoReadModel,
  | 'estaPendiente'
  | 'estaEjecutando'
  | 'fueExitoso'
  | 'fueFallido'
  | 'fueOmitido'
  | 'esTerminal'
>;

export function conEstadoPaso(d: DatosPaso): PppoeOperacionPasoReadModel {
  const E = EstadoPasoPppoe;
  return {
    ...d,
    estaPendiente: d.estado === E.PENDIENTE,
    estaEjecutando: d.estado === E.EJECUTANDO,
    fueExitoso: d.estado === E.EXITOSO,
    fueFallido: d.estado === E.FALLIDO,
    fueOmitido: d.estado === E.OMITIDO,
    esTerminal: [E.EXITOSO, E.FALLIDO, E.OMITIDO].includes(d.estado),
  };
}

export function paso(
  orden: number,
  tipo: TipoPasoPppoe,
  estado: EstadoPasoPppoe,
): PppoeOperacionPasoReadModel {
  return conEstadoPaso({
    id: 100 + orden,
    operacionId: 10,
    tipo,
    orden,
    estado,
    comandoSanitizado: null,
    respuestaSanitizada: null,
    errorCodigo: null,
    errorMensaje: null,
    iniciadoEn: null,
    finalizadoEn: null,
    duracionMs: null,
    creadoEn: INICIO,
    actualizadoEn: INICIO,
  });
}

type DatosCuenta = Pick<ClientePppoeCuentaReadModel, 'estado'> &
  Partial<ClientePppoeCuentaReadModel>;

/** Cuenta con las banderas derivadas de su estado y fechas. */
export function cuenta(datos: DatosCuenta): ClientePppoeCuentaReadModel {
  const base = {
    id: 20,
    empresaId: 1,
    accesoInternetId: 30,
    perfilHomologacionId: 4,
    usuario: 'cliente.prueba',
    secretoProtegido: {
      secretoCifrado: 'x',
      secretoIv: 'x',
      secretoAuthTag: 'x',
      versionClave: 1,
    },
    generadoPorId: 7,
    adoptadoPorId: null,
    generadoEn: INICIO,
    secretCreadoEn: null,
    activadoEn: null,
    suspendidoEn: null,
    eliminadoEn: null,
    adoptadoEn: null,
    ultimaSincronizacionEn: null,
    ultimoError: null,
    actualizadoEn: INICIO,
    ...datos,
  };
  const E = EstadoCuentaPppoe;
  return {
    ...base,
    estaPendienteActivacion: base.estado === E.PENDIENTE_ACTIVACION,
    estaActiva: base.estado === E.ACTIVA,
    estaSuspendida: base.estado === E.SUSPENDIDA,
    estaEliminada: base.estado === E.ELIMINADA,
    tieneSecretCreado: base.secretCreadoEn !== null || base.adoptadoEn !== null,
    tieneError: base.estado === E.ERROR || base.ultimoError !== null,
    esAdoptada: base.adoptadoEn !== null,
  };
}
