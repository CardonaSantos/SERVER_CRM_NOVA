import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
} from '../enums/pppoe-operacion.enum';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
} from '../errors/pppoe-operacion.errors';
import { PppoeOperacionPasoProps } from '../props/pppoe-operacion-paso.props';
import { PppoeOperacionProps } from '../props/pppoe-operacion.props';

/**
 * Invariantes que debe cumplir una operación o un paso, sea recién creado o
 * leído de la BD: que los campos presentes cuadren con el estado.
 */

const invalido = (mensaje: string) =>
  new OperacionPppoeDatosInvalidosError(mensaje);

const antes = (a: Date | null, b: Date | null) =>
  a !== null && b !== null && a.getTime() < b.getTime();

export function verificarConsistenciaOperacion(p: PppoeOperacionProps): void {
  if (p.instalacionId !== null && p.desinstalacionId !== null) {
    throw invalido(
      'Una operación no puede pertenecer simultáneamente a una instalación y una desinstalación.',
    );
  }
  if (p.id !== null && p.reintentoDeId === p.id) {
    throw invalido('Una operación no puede ser reintento de sí misma.');
  }
  if (p.reintentoDeId === null && p.numeroIntento !== 1) {
    throw invalido('Una operación inicial debe tener numeroIntento igual a 1.');
  }
  if (p.reintentoDeId !== null && p.numeroIntento < 2) {
    throw invalido(
      'Un reintento debe tener numeroIntento mayor o igual que 2.',
    );
  }
  if (p.origen === OrigenOperacionPppoe.OPERADOR && p.iniciadoPorId === null) {
    throw invalido(
      'Una operación originada por OPERADOR debe contener iniciadoPorId.',
    );
  }
  if (p.requiereReautenticacion && p.iniciadoPorId === null) {
    throw invalido(
      'Una operación con reautenticación debe tener iniciadoPorId.',
    );
  }

  verificarReautenticacion(p);

  const tienePerfilId = p.perfilHomologacionId !== null;
  if (tienePerfilId !== (p.codigoPerfilSnapshot !== null)) {
    throw invalido(
      'perfilHomologacionId y codigoPerfilSnapshot deben existir juntos.',
    );
  }
  if (p.tipo === TipoOperacionPppoe.CREAR_SECRET && !tienePerfilId) {
    throw invalido(
      'CREAR_SECRET requiere perfilHomologacionId y codigoPerfilSnapshot.',
    );
  }
  if (
    p.canal === CanalOperacionPppoe.SSH &&
    (p.routerHostSnapshot === null || p.routerPuertoSnapshot === null)
  ) {
    throw invalido(
      'Una operación SSH requiere routerHostSnapshot y routerPuertoSnapshot.',
    );
  }

  verificarEstadoOperacion(p);
}

/** Orden de las fechas; solo aplica a lo leído de la BD. */
export function verificarFechasOperacion(p: PppoeOperacionProps): void {
  if (antes(p.actualizadoEn, p.creadoEn)) {
    throw invalido('actualizadoEn no puede ser anterior a creadoEn.');
  }
  const fechas = {
    reautenticadoEn: p.reautenticadoEn,
    iniciadoEn: p.iniciadoEn,
    finalizadoEn: p.finalizadoEn,
    canceladoEn: p.canceladoEn,
  };
  for (const [campo, fecha] of Object.entries(fechas)) {
    if (antes(fecha, p.creadoEn)) {
      throw invalido(`${campo} no puede ser anterior a creadoEn.`);
    }
  }
  if (antes(p.iniciadoEn, p.reautenticadoEn)) {
    throw invalido('iniciadoEn no puede ser anterior a reautenticadoEn.');
  }
  if (antes(p.finalizadoEn, p.iniciadoEn)) {
    throw invalido('finalizadoEn no puede ser anterior a iniciadoEn.');
  }
}

export function verificarConsistenciaPaso(p: PppoeOperacionPasoProps): void {
  if (antes(p.actualizadoEn, p.creadoEn)) {
    throw invalido('actualizadoEn no puede ser anterior a creadoEn.');
  }
  if (antes(p.iniciadoEn, p.creadoEn)) {
    throw invalido('iniciadoEn no puede ser anterior a creadoEn.');
  }
  if (antes(p.finalizadoEn, p.creadoEn)) {
    throw invalido('finalizadoEn no puede ser anterior a creadoEn.');
  }
  if (antes(p.finalizadoEn, p.iniciadoEn)) {
    throw invalido('finalizadoEn no puede ser anterior a iniciadoEn.');
  }

  const conError = p.errorCodigo !== null || p.errorMensaje !== null;

  switch (p.estado) {
    case EstadoPasoPppoe.PENDIENTE:
      if (
        p.iniciadoEn !== null ||
        p.finalizadoEn !== null ||
        p.duracionMs !== null
      ) {
        throw invalido(
          'Un paso PENDIENTE no puede contener fechas de ejecución ni duración.',
        );
      }
      if (conError) {
        throw invalido('Un paso PENDIENTE no puede contener datos de error.');
      }
      return;

    case EstadoPasoPppoe.EJECUTANDO:
      if (p.iniciadoEn === null) {
        throw invalido('Un paso EJECUTANDO debe contener iniciadoEn.');
      }
      if (p.finalizadoEn !== null || p.duracionMs !== null) {
        throw invalido(
          'Un paso EJECUTANDO no puede contener finalizadoEn ni duracionMs.',
        );
      }
      if (conError) {
        throw invalido('Un paso EJECUTANDO no puede contener un error final.');
      }
      return;

    case EstadoPasoPppoe.EXITOSO:
    case EstadoPasoPppoe.FALLIDO:
      if (
        p.iniciadoEn === null ||
        p.finalizadoEn === null ||
        p.duracionMs === null
      ) {
        throw invalido(
          `Un paso ${p.estado} debe contener iniciadoEn, finalizadoEn y duracionMs.`,
        );
      }
      if (p.estado === EstadoPasoPppoe.EXITOSO && conError) {
        throw invalido('Un paso EXITOSO no puede contener datos de error.');
      }
      if (
        p.estado === EstadoPasoPppoe.FALLIDO &&
        (!p.errorCodigo || !p.errorMensaje)
      ) {
        throw invalido(
          'Un paso FALLIDO debe contener errorCodigo y errorMensaje.',
        );
      }
      return;

    case EstadoPasoPppoe.OMITIDO:
      if (p.iniciadoEn !== null) {
        throw invalido('Un paso OMITIDO no debe contener iniciadoEn.');
      }
      if (p.finalizadoEn === null) {
        throw invalido('Un paso OMITIDO debe contener finalizadoEn.');
      }
      if (p.duracionMs !== 0) {
        throw invalido('Un paso OMITIDO debe tener duracionMs igual a cero.');
      }
      if (conError) {
        throw invalido('Un paso OMITIDO no puede contener datos de error.');
      }
      return;

    default: {
      const exhaustivo: never = p.estado;
      throw new Error(`Estado de paso no soportado: ${exhaustivo}.`);
    }
  }
}

function verificarReautenticacion(p: PppoeOperacionProps): void {
  if (!p.requiereReautenticacion) {
    if (
      p.reautenticadoPorId !== null ||
      p.reautenticacionExitosa !== null ||
      p.reautenticadoEn !== null
    ) {
      throw new OperacionPppoeEstadoInvalidoError(
        'Una operación que no requiere reautenticación no debe contener datos de reautenticación.',
      );
    }
    return;
  }

  const evaluada = p.reautenticacionExitosa !== null;
  const conDatos = p.reautenticadoPorId !== null || p.reautenticadoEn !== null;
  const completa = p.reautenticadoPorId !== null && p.reautenticadoEn !== null;

  if (!evaluada && conDatos) {
    throw invalido(
      'Una reautenticación no evaluada no debe contener operador ni fecha.',
    );
  }
  if (evaluada && !completa) {
    throw invalido(
      'Una reautenticación evaluada debe contener reautenticadoPorId y reautenticadoEn.',
    );
  }
}

function verificarEstadoOperacion(p: PppoeOperacionProps): void {
  const conResultado =
    p.resultado !== null || p.errorCodigo !== null || p.errorMensaje !== null;

  switch (p.estado) {
    case EstadoOperacionPppoe.PENDIENTE:
      verificarSinIniciar(p, conResultado);
      if (p.reautenticacionExitosa === true) {
        throw invalido(
          'Una operación con reautenticación exitosa debe estar AUTORIZADA o haber comenzado.',
        );
      }
      return;

    case EstadoOperacionPppoe.AUTORIZADA:
      verificarSinIniciar(p, conResultado);
      if (!p.requiereReautenticacion || !autorizacionValida(p)) {
        throw invalido(
          'Una operación AUTORIZADA debe contener una reautenticación exitosa.',
        );
      }
      return;

    case EstadoOperacionPppoe.EJECUTANDO:
      if (p.iniciadoEn === null) {
        throw invalido('Una operación EJECUTANDO debe contener iniciadoEn.');
      }
      if (
        p.finalizadoEn !== null ||
        p.canceladoEn !== null ||
        p.duracionMs !== null
      ) {
        throw invalido(
          'Una operación EJECUTANDO no puede contener fechas finales ni duración.',
        );
      }
      if (conResultado) {
        throw invalido(
          'Una operación EJECUTANDO no puede contener un resultado final.',
        );
      }
      verificarAutorizadaSiSeRequiere(p);
      return;

    case EstadoOperacionPppoe.EXITOSA:
    case EstadoOperacionPppoe.PARCIAL:
    case EstadoOperacionPppoe.FALLIDA:
      if (
        p.iniciadoEn === null ||
        p.finalizadoEn === null ||
        p.duracionMs === null
      ) {
        throw invalido(
          `Una operación ${p.estado} debe contener iniciadoEn, finalizadoEn y duracionMs.`,
        );
      }
      if (p.canceladoEn !== null) {
        throw invalido(
          `Una operación ${p.estado} no puede contener canceladoEn.`,
        );
      }
      verificarAutorizadaSiSeRequiere(p);
      if (
        p.estado === EstadoOperacionPppoe.EXITOSA &&
        (p.errorCodigo !== null || p.errorMensaje !== null)
      ) {
        throw invalido(
          'Una operación EXITOSA no puede contener datos de error.',
        );
      }
      if (
        p.estado !== EstadoOperacionPppoe.EXITOSA &&
        (!p.errorCodigo || !p.errorMensaje)
      ) {
        throw invalido(
          `Una operación ${p.estado} debe contener errorCodigo y errorMensaje.`,
        );
      }
      return;

    case EstadoOperacionPppoe.CANCELADA:
      if (p.canceladoEn === null) {
        throw invalido('Una operación CANCELADA debe contener canceladoEn.');
      }
      if (!p.motivo) {
        throw invalido('Una operación CANCELADA debe contener motivo.');
      }
      if (
        p.iniciadoEn !== null ||
        p.finalizadoEn !== null ||
        p.duracionMs !== null
      ) {
        throw invalido(
          'Una operación CANCELADA no puede contener ejecución ni duración.',
        );
      }
      if (conResultado) {
        throw invalido(
          'Una operación CANCELADA no puede contener un resultado técnico final.',
        );
      }
      return;

    default: {
      const exhaustivo: never = p.estado;
      throw new Error(`Estado de operación no soportado: ${exhaustivo}.`);
    }
  }
}

function verificarSinIniciar(
  p: PppoeOperacionProps,
  conResultado: boolean,
): void {
  if (
    p.iniciadoEn !== null ||
    p.finalizadoEn !== null ||
    p.canceladoEn !== null ||
    p.duracionMs !== null
  ) {
    throw invalido(
      `Una operación ${p.estado} no puede contener fechas de ejecución ni duración.`,
    );
  }
  if (conResultado) {
    throw invalido(
      `Una operación ${p.estado} no puede contener resultados finales.`,
    );
  }
}

export function autorizacionValida(p: PppoeOperacionProps): boolean {
  return (
    p.reautenticacionExitosa === true &&
    p.reautenticadoPorId !== null &&
    p.reautenticadoEn !== null
  );
}

function verificarAutorizadaSiSeRequiere(p: PppoeOperacionProps): void {
  if (p.requiereReautenticacion && !autorizacionValida(p)) {
    throw new OperacionPppoeEstadoInvalidoError(
      'La operación requería reautenticación y no contiene una autorización válida.',
    );
  }
}
