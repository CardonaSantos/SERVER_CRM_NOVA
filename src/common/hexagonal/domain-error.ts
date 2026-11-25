/**
 * Base de todos los errores de negocio de los módulos hexagonales
 * (estándar §4.5). Es TypeScript puro: el dominio puede importarlo.
 *
 * El filtro global lo traduce al contrato único de error (§7.5):
 *
 * | tipo            | HTTP |
 * |-----------------|------|
 * | INVALIDO        | 400  |
 * | PROHIBIDO       | 403  |
 * | NO_ENCONTRADO   | 404  |
 * | CONFLICTO       | 409  |
 * | EXTERNO         | 502  |
 *
 * Reglas para las subclases:
 * - `codigo`: UPPER_SNAKE y estable. La UI decide con él; no se renombra.
 * - `message`: lo verá el usuario. Español claro, sin ids internos, SQL,
 *   IPs de routers, usuarios PPPoE, secretos ni trazas.
 * - El detalle técnico va en `causa`: solo se registra en el log.
 *
 * @example
 * export class ZonaFacturacionNoEncontradaError extends DomainError {
 *   readonly codigo = 'ZONA_FACTURACION_NO_ENCONTRADA';
 *   readonly tipo = 'NO_ENCONTRADO';
 *   constructor() { super('Zona de facturación no encontrada.'); }
 * }
 */
export type TipoErrorDominio =
  | 'INVALIDO'
  | 'NO_ENCONTRADO'
  | 'CONFLICTO'
  | 'PROHIBIDO'
  | 'EXTERNO';

export type OpcionesErrorDominio = {
  /** Error original (Prisma, SSH, HTTP de un tercero). Nunca llega a la UI. */
  causa?: unknown;
};

const CODIGO_VALIDO = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export abstract class DomainError extends Error {
  abstract readonly codigo: string;

  abstract readonly tipo: TipoErrorDominio;

  readonly causa?: unknown;

  protected constructor(mensaje: string, opciones: OpcionesErrorDominio = {}) {
    super(mensaje);
    this.name = new.target.name;
    this.causa = opciones.causa;
  }

  /** `true` si `codigo` respeta el formato UPPER_SNAKE. */
  static esCodigoValido(codigo: unknown): codigo is string {
    return typeof codigo === 'string' && CODIGO_VALIDO.test(codigo);
  }
}

/** Reconoce un DomainError aunque venga de otra copia del módulo. */
export function esDomainError(error: unknown): error is DomainError {
  if (error instanceof DomainError) return true;

  if (!(error instanceof Error)) return false;

  const candidato = error as Partial<DomainError>;

  return (
    DomainError.esCodigoValido(candidato.codigo) &&
    typeof candidato.tipo === 'string' &&
    ['INVALIDO', 'NO_ENCONTRADO', 'CONFLICTO', 'PROHIBIDO', 'EXTERNO'].includes(
      candidato.tipo,
    )
  );
}
