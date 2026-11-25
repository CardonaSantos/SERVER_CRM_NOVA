/**
 * Contrato único de error hacia la UI (estándar §7.5).
 *
 * Toda respuesta de error HTTP tiene esta forma, venga de donde venga:
 *
 * { statusCode, codigo, message, campos?, requestId }
 *
 * - `codigo`: estable, UPPER_SNAKE. La UI decide con él.
 * - `message`: siempre texto, listo para mostrar al usuario.
 * - `campos`: solo en errores de validación (codigo VALIDACION).
 * - `requestId`: también va en la cabecera X-Request-ID.
 */
export type CampoConError = {
  /** Ruta del campo: `nombre`, `direccion.calle`, `items.0.cantidad`. */
  campo: string;

  mensajes: string[];
};

export type CuerpoError = {
  statusCode: number;

  codigo: string;

  message: string;

  campos?: CampoConError[];

  requestId: string;

  /** Solo con EXPONER_DETALLE_ERRORES=true (local). Nunca en Railway. */
  detalle?: unknown;
};

export const CODIGO_VALIDACION = 'VALIDACION';

export const MENSAJE_VALIDACION = 'Hay datos inválidos en la solicitud.';

export const MENSAJE_ERROR_INTERNO =
  'Ha ocurrido un error interno en el servidor';
