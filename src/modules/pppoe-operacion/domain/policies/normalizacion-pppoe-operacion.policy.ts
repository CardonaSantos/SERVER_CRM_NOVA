import { OperacionPppoeDatosInvalidosError } from '../errors/pppoe-operacion.errors';
import { DomainJsonObject } from '../props/json-dominio.props';

/** Validación de forma compartida por la operación y sus pasos. */

const MAX_ERROR_CODIGO = 120;
const MAX_TEXTO_TECNICO = 10_000;
const MAX_RESULTADO = 50_000;

/**
 * Se comparan por nombre exacto normalizado para permitir claves seguras
 * como `secretEncontrado` o `secretCreado`.
 */
const CLAVES_SENSIBLES = new Set<string>([
  'password',
  'passwd',
  'pass',
  'contrasena',
  'clave',
  'clavepppoe',
  'passwordpppoe',
  'secreto',
  'secretocifrado',
  'secretoiv',
  'secretoauthtag',
  'token',
  'authorization',
  'privatekey',
  'sshpassword',
  'aeskey',
]);

const invalido = (mensaje: string) =>
  new OperacionPppoeDatosInvalidosError(mensaje);

export function enteroPositivo(valor: number, campo: string): number {
  if (!Number.isInteger(valor) || valor <= 0) {
    throw invalido(`${campo} debe ser un entero positivo.`);
  }
  return valor;
}

export function enteroPositivoOpcional(
  valor: number | null,
  campo: string,
): number | null {
  return valor === null ? null : enteroPositivo(valor, campo);
}

export function puertoRed(valor: number, campo: string): number {
  if (!Number.isInteger(valor) || valor < 1 || valor > 65_535) {
    throw invalido(`${campo} debe ser un puerto válido entre 1 y 65535.`);
  }
  return valor;
}

export function puertoRedOpcional(
  valor: number | null,
  campo: string,
): number | null {
  return valor === null ? null : puertoRed(valor, campo);
}

export function textoObligatorio(
  valor: string,
  campo: string,
  max: number,
): string {
  const t = valor?.trim();
  if (!t) throw invalido(`${campo} es obligatorio.`);
  if (t.length > max) {
    throw invalido(`${campo} no puede superar ${max} caracteres.`);
  }
  return t;
}

export function textoOpcional(
  valor: string | null,
  campo: string,
  max: number,
): string | null {
  if (valor === null) return null;
  const t = valor.trim();
  if (!t) return null;
  if (t.length > max) {
    throw invalido(`${campo} no puede superar ${max} caracteres.`);
  }
  return t;
}

export function codigoError(valor: string | null): string | null {
  if (valor === null) return null;
  const t = valor.trim().toUpperCase();
  if (!t) return null;
  if (t.length > MAX_ERROR_CODIGO) {
    throw invalido(
      `errorCodigo no puede superar ${MAX_ERROR_CODIGO} caracteres.`,
    );
  }
  if (!/^[A-Z0-9_.:-]+$/.test(t)) {
    throw invalido('errorCodigo contiene caracteres no permitidos.');
  }
  return t;
}

export function codigoErrorObligatorio(valor: string): string {
  const t = codigoError(valor);
  if (!t) throw invalido('errorCodigo es obligatorio.');
  return t;
}

/** Valida y devuelve una copia de la fecha. */
export function fechaValida(valor: Date, campo: string): Date {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw invalido(`${campo} debe contener una fecha válida.`);
  }
  return fecha;
}

export function fechaOpcional(valor: Date | null, campo: string): Date | null {
  return valor === null ? null : fechaValida(valor, campo);
}

export function clonarFecha(valor: Date | null): Date | null {
  return valor ? new Date(valor.getTime()) : null;
}

export function duracionOpcional(valor: number | null): number | null {
  if (valor === null) return null;
  if (!Number.isInteger(valor) || valor < 0) {
    throw invalido('duracionMs debe ser un entero mayor o igual que cero.');
  }
  return valor;
}

export function valorDeEnum<TEnum extends Record<string, string>>(
  valor: string,
  enumerado: TEnum,
  campo: string,
): TEnum[keyof TEnum] {
  if (!(Object.values(enumerado) as string[]).includes(valor)) {
    throw invalido(`${campo} contiene un valor no soportado: ${valor}.`);
  }
  return valor as TEnum[keyof TEnum];
}

/**
 * Redacción defensiva de credenciales en comandos y respuestas de RouterOS.
 * No sustituye la sanitización que hace mikrotik-ssh.
 */
export function textoTecnico(
  valor: string | null | undefined,
  campo: string,
): string | null {
  if (valor == null) return null;
  const t = valor.trim();
  if (!t) return null;

  const redactado = t
    .replace(
      /(\b(?:password|passwd|pass|token|authorization|private[_ -]?key|secretoCifrado|secretoIv|secretoAuthTag)\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1[REDACTED]',
    )
    .replace(/(PPPOE_SECRET_KEY_V\d+\s*=\s*)[^\s]+/gi, '$1[REDACTED]');

  if (redactado.length > MAX_TEXTO_TECNICO) {
    throw invalido(
      `${campo} no puede superar ${MAX_TEXTO_TECNICO} caracteres.`,
    );
  }
  return redactado;
}

export function textoTecnicoObligatorio(valor: string, campo: string): string {
  const t = textoTecnico(valor, campo);
  if (!t) throw invalido(`${campo} es obligatorio.`);
  return t;
}

/** Valida que el resultado sea JSON plano, sin claves sensibles, y lo copia. */
export function resultadoSeguro(
  valor: DomainJsonObject | null,
): DomainJsonObject | null {
  if (valor === null) return null;
  verificarJsonSeguro(valor, 'resultado');

  const serializado = JSON.stringify(valor);
  if (serializado.length > MAX_RESULTADO) {
    throw invalido(
      `resultado no puede superar ${MAX_RESULTADO} caracteres serializados.`,
    );
  }
  return JSON.parse(serializado) as DomainJsonObject;
}

export function clonarResultado(
  valor: DomainJsonObject | null,
): DomainJsonObject | null {
  return valor === null
    ? null
    : (JSON.parse(JSON.stringify(valor)) as DomainJsonObject);
}

function verificarJsonSeguro(valor: unknown, ruta: string): void {
  if (valor === null || typeof valor === 'string' || typeof valor === 'boolean')
    return;

  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) {
      throw invalido(`${ruta} contiene un número no válido.`);
    }
    return;
  }

  if (Array.isArray(valor)) {
    valor.forEach((item, i) => verificarJsonSeguro(item, `${ruta}[${i}]`));
    return;
  }

  if (
    typeof valor !== 'object' ||
    Object.getPrototypeOf(valor) !== Object.prototype
  ) {
    throw invalido(`${ruta} debe contener únicamente valores JSON válidos.`);
  }

  for (const [clave, hijo] of Object.entries(valor)) {
    if (CLAVES_SENSIBLES.has(normalizarClave(clave))) {
      throw invalido(
        `${ruta}.${clave} contiene una clave sensible que no puede persistirse.`,
      );
    }
    verificarJsonSeguro(hijo, `${ruta}.${clave}`);
  }
}

function normalizarClave(clave: string): string {
  return clave
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}
