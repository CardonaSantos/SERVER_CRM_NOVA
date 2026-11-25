import { HttpException, HttpStatus } from '@nestjs/common';

import {
  DomainError,
  esDomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

import {
  CampoConError,
  CODIGO_VALIDACION,
  CuerpoError,
  MENSAJE_ERROR_INTERNO,
  MENSAJE_VALIDACION,
} from './contrato-error';

/**
 * Traduce cualquier excepción al contrato único de error (estándar §7.5).
 * Función pura: el filtro global solo agrega el requestId, registra y
 * responde.
 */

export type NivelRegistro = 'error' | 'warn' | null;

export type RespuestaError = {
  status: number;

  cuerpo: CuerpoError;

  /** Qué registrar en el log: los 4xx esperados no se registran. */
  registro: NivelRegistro;

  /** Detalle real para el log. Nunca va al cuerpo (salvo `detalle` local). */
  mensajeInterno: string;
};

export type OpcionesRespuestaError = {
  exponerDetalle?: boolean;
};

const STATUS_POR_TIPO: Record<TipoErrorDominio, number> = {
  INVALIDO: HttpStatus.BAD_REQUEST,
  PROHIBIDO: HttpStatus.FORBIDDEN,
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
  EXTERNO: HttpStatus.BAD_GATEWAY,
};

const CODIGO_POR_STATUS: Record<number, string> = {
  400: 'SOLICITUD_INVALIDA',
  401: 'NO_AUTENTICADO',
  403: 'PROHIBIDO',
  404: 'NO_ENCONTRADO',
  405: 'METODO_NO_PERMITIDO',
  409: 'CONFLICTO',
  410: 'ENDPOINT_RETIRADO',
  413: 'CARGA_DEMASIADO_GRANDE',
  415: 'TIPO_NO_SOPORTADO',
  422: 'NO_PROCESABLE',
  429: 'DEMASIADOS_INTENTOS',
  500: 'ERROR_INTERNO',
  501: 'NO_IMPLEMENTADO',
  502: 'SERVICIO_EXTERNO',
  503: 'SERVICIO_NO_DISPONIBLE',
  504: 'TIEMPO_AGOTADO',
};

const MENSAJE_POR_STATUS: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  403: 'No tiene permisos para esta operación.',
  404: 'El recurso solicitado no existe.',
  405: 'Método no permitido.',
  409: 'La operación entra en conflicto con el estado actual.',
  410: 'Este recurso ya no está disponible.',
  413: 'El archivo o la solicitud es demasiado grande.',
  415: 'Tipo de contenido no soportado.',
  422: 'No se pudo procesar la solicitud.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: MENSAJE_ERROR_INTERNO,
  502: 'Un servicio externo no respondió correctamente. Inténtalo más tarde.',
  503: 'El servicio no está disponible en este momento. Inténtalo más tarde.',
  504: 'Un servicio externo tardó demasiado en responder. Inténtalo más tarde.',
};

/** Frases por defecto de Nest/Express (en inglés): se reemplazan por las nuestras. */
const FRASES_GENERICAS = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Forbidden resource',
  'Not Found',
  'Method Not Allowed',
  'Conflict',
  'Gone',
  'Payload Too Large',
  'Unsupported Media Type',
  'Unprocessable Entity',
  'Too Many Requests',
  'ThrottlerException: Too Many Requests',
  'Internal Server Error',
  'Not Implemented',
  'Bad Gateway',
  'Service Unavailable',
  'Gateway Timeout',
  'Http Exception',
]);

/** `Cannot GET /ruta` (ruta inexistente). */
const RUTA_INEXISTENTE = /^Cannot [A-Z]+ \//;

/** Mensajes de ParseIntPipe, ParseUUIDPipe, ParseEnumPipe… */
const PIPE_DE_PARAMETRO = /^Validation failed \(/;

/** errorCode que pone throwFatalError / mapPrismaErrorToHttpException. */
const CODIGOS_INTERNOS = new Set(['INTERNAL_SERVER_ERROR', 'UNKNOWN_ERROR']);

const MAX_MENSAJE = 500;

export function construirRespuestaError(
  exception: unknown,
  requestId: string,
  opciones: OpcionesRespuestaError = {},
): RespuestaError {
  if (esDomainError(exception)) {
    return desdeDomainError(exception, requestId);
  }

  if (exception instanceof HttpException) {
    return desdeHttpException(exception, requestId, opciones);
  }

  const httpError = comoHttpErrorExpuesto(exception);

  if (httpError) {
    return respuesta(httpError.status, requestId, {
      codigo: codigoPorStatus(httpError.status),
      message: mensajePorStatus(httpError.status),
      registro: null,
      mensajeInterno: httpError.mensaje,
    });
  }

  return errorInterno(exception, requestId, opciones, null);
}

function desdeDomainError(
  error: DomainError,
  requestId: string,
): RespuestaError {
  const status = STATUS_POR_TIPO[error.tipo];
  const causa = error.causa;
  const detalleCausa =
    causa instanceof Error ? causa.message : causa ? String(causa) : '';

  return respuesta(status, requestId, {
    codigo: error.codigo,
    message: limpiar(error.message) ?? mensajePorStatus(status),
    registro: error.tipo === 'EXTERNO' ? 'warn' : null,
    mensajeInterno: `${error.name}: ${error.message}${detalleCausa ? ` (causa: ${detalleCausa})` : ''}`,
  });
}

function desdeHttpException(
  exception: HttpException,
  requestId: string,
  opciones: OpcionesRespuestaError,
): RespuestaError {
  const status = exception.getStatus();
  const original = exception.getResponse();
  const cuerpo =
    original && typeof original === 'object'
      ? (original as Record<string, unknown>)
      : {};

  if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
    return errorInterno(exception, requestId, opciones, original);
  }

  if (status >= 500) {
    return respuesta(status, requestId, {
      codigo: codigoDeclarado(cuerpo) ?? codigoPorStatus(status),
      message: extraerMensaje(original, cuerpo) ?? mensajePorStatus(status),
      registro: 'warn',
      mensajeInterno: exception.message,
    });
  }

  const campos = extraerCampos(cuerpo, status);

  if (campos) {
    return respuesta(status, requestId, {
      codigo: CODIGO_VALIDACION,
      message: MENSAJE_VALIDACION,
      campos,
      registro: null,
      mensajeInterno: exception.message,
    });
  }

  return respuesta(status, requestId, {
    codigo: codigoDeclarado(cuerpo) ?? codigoPorStatus(status),
    message: extraerMensaje(original, cuerpo) ?? mensajePorStatus(status),
    registro: null,
    mensajeInterno: exception.message,
  });
}

/**
 * 500: nunca sale el mensaje real. Se conserva solo el mensaje deliberado
 * de una InternalServerErrorException propia (sin errorCode interno).
 */
function errorInterno(
  exception: unknown,
  requestId: string,
  opciones: OpcionesRespuestaError,
  original: unknown,
): RespuestaError {
  const cuerpo =
    original && typeof original === 'object'
      ? (original as Record<string, unknown>)
      : {};

  let message = MENSAJE_ERROR_INTERNO;
  let codigo = 'ERROR_INTERNO';

  if (
    exception instanceof HttpException &&
    !CODIGOS_INTERNOS.has(String(cuerpo.errorCode))
  ) {
    message = extraerMensaje(original, cuerpo) ?? MENSAJE_ERROR_INTERNO;
    codigo = codigoDeclarado(cuerpo) ?? codigo;
  }

  const mensajeInterno =
    exception instanceof Error ? exception.message : String(exception);

  const resultado = respuesta(HttpStatus.INTERNAL_SERVER_ERROR, requestId, {
    codigo,
    message,
    registro: 'error',
    mensajeInterno,
  });

  if (opciones.exponerDetalle) {
    resultado.cuerpo.detalle = { mensaje: mensajeInterno, original };
  }

  return resultado;
}

function respuesta(
  status: number,
  requestId: string,
  datos: {
    codigo: string;
    message: string;
    campos?: CampoConError[];
    registro: NivelRegistro;
    mensajeInterno: string;
  },
): RespuestaError {
  const cuerpo: CuerpoError = {
    statusCode: status,
    codigo: datos.codigo,
    message: datos.message,
    requestId,
  };

  if (datos.campos) {
    cuerpo.campos = datos.campos;
  }

  return {
    status,
    cuerpo,
    registro: datos.registro,
    mensajeInterno: datos.mensajeInterno,
  };
}

/** `codigo` (nuevo) o `errorCode` (legacy) si es UPPER_SNAKE y no es interno. */
function codigoDeclarado(cuerpo: Record<string, unknown>): string | null {
  for (const candidato of [cuerpo.codigo, cuerpo.errorCode]) {
    if (
      DomainError.esCodigoValido(candidato) &&
      !CODIGOS_INTERNOS.has(candidato) &&
      !candidato.startsWith('PRISMA_')
    ) {
      return candidato;
    }
  }

  return null;
}

function codigoPorStatus(status: number): string {
  return (
    CODIGO_POR_STATUS[status] ??
    (status >= 500 ? 'ERROR_SERVIDOR' : `ERROR_HTTP_${status}`)
  );
}

function mensajePorStatus(status: number): string {
  return (
    MENSAJE_POR_STATUS[status] ??
    (status >= 500 ? MENSAJE_ERROR_INTERNO : MENSAJE_POR_STATUS[400])
  );
}

/**
 * Primer texto útil entre: la respuesta si es texto, `message` (si es
 * arreglo se une) y `error` (algunos legacy, p. ej. Banrural, ponen ahí
 * el mensaje). Las frases genéricas de Nest no cuentan.
 */
function extraerMensaje(
  original: unknown,
  cuerpo: Record<string, unknown>,
): string | null {
  const candidatos: unknown[] = [
    typeof original === 'string' ? original : undefined,
    Array.isArray(cuerpo.message)
      ? cuerpo.message.filter((m) => typeof m === 'string').join('. ')
      : cuerpo.message,
    cuerpo.error,
  ];

  for (const candidato of candidatos) {
    const texto = limpiar(candidato);

    if (texto) return texto;
  }

  return null;
}

function limpiar(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;

  const texto = valor.trim();

  if (
    !texto ||
    FRASES_GENERICAS.has(texto) ||
    RUTA_INEXISTENTE.test(texto) ||
    PIPE_DE_PARAMETRO.test(texto)
  ) {
    return null;
  }

  return texto.length > MAX_MENSAJE ? `${texto.slice(0, MAX_MENSAJE)}…` : texto;
}

/**
 * `campos` estructurados (ErrorValidacionHttp del pipe global) o, como
 * respaldo, los mensajes en arreglo de un ValidationPipe local (400).
 */
function extraerCampos(
  cuerpo: Record<string, unknown>,
  status: number,
): CampoConError[] | null {
  if (status !== HttpStatus.BAD_REQUEST) return null;

  if (cuerpo.codigo === CODIGO_VALIDACION && Array.isArray(cuerpo.campos)) {
    const campos = cuerpo.campos.filter(esCampoConError);

    if (campos.length > 0) return campos;
  }

  if (Array.isArray(cuerpo.message) && cuerpo.message.length > 0) {
    const mensajes = cuerpo.message.filter(
      (m): m is string => typeof m === 'string',
    );

    if (mensajes.length > 0) return camposDesdeMensajes(mensajes);
  }

  return null;
}

function esCampoConError(valor: unknown): valor is CampoConError {
  if (!valor || typeof valor !== 'object') return false;

  const campo = valor as Record<string, unknown>;

  return (
    typeof campo.campo === 'string' &&
    Array.isArray(campo.mensajes) &&
    campo.mensajes.every((m) => typeof m === 'string')
  );
}

/**
 * Los mensajes de class-validator empiezan con la ruta del campo
 * ("nombre must be a string", "property x should not exist",
 * "each value in estados must be …").
 */
export function camposDesdeMensajes(mensajes: string[]): CampoConError[] {
  const porCampo = new Map<string, string[]>();

  for (const mensaje of mensajes) {
    const campo =
      /^property (\S+) should not exist$/.exec(mensaje)?.[1] ??
      /^each value in (\S+) /.exec(mensaje)?.[1] ??
      mensaje.split(/\s+/)[0] ??
      '';

    const lista = porCampo.get(campo) ?? [];
    lista.push(mensaje);
    porCampo.set(campo, lista);
  }

  return [...porCampo.entries()].map(([campo, lista]) => ({
    campo,
    mensajes: lista,
  }));
}

/** Errores de http-errors (body-parser, multer) con `expose: true`. */
function comoHttpErrorExpuesto(
  exception: unknown,
): { status: number; mensaje: string } | null {
  if (!exception || typeof exception !== 'object') return null;

  const candidato = exception as {
    status?: unknown;
    statusCode?: unknown;
    expose?: unknown;
    message?: unknown;
  };

  const status = Number(candidato.statusCode ?? candidato.status);

  if (
    candidato.expose === true &&
    Number.isInteger(status) &&
    status >= 400 &&
    status < 500
  ) {
    return {
      status,
      mensaje: typeof candidato.message === 'string' ? candidato.message : '',
    };
  }

  return null;
}
