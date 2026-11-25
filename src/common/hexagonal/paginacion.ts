/**
 * Paginación común de los listados (estándar §7.6). TypeScript puro.
 *
 * Flujo:
 *   QueryDto (page, limit) → normalizarPaginacion() → puerto de consulta
 *   → ResultadoPaginado<ReadModel> → presentarPaginado(r, Presenter.item)
 *   → RespuestaPaginada<ResponseDto> = { data, meta } (contrato HTTP).
 */

export const PAGINA_POR_DEFECTO = 1;

export const LIMITE_POR_DEFECTO = 10;

export const LIMITE_MAXIMO = 100;

/** Página ya normalizada que recibe un puerto de consulta. */
export type Paginacion = {
  /** Desde 1. */
  page: number;

  limit: number;
};

export type DireccionOrden = 'asc' | 'desc';

/** Lo que devuelve un puerto de consulta paginado. */
export type ResultadoPaginado<T> = {
  items: T[];

  total: number;

  page: number;

  limit: number;
};

export type MetaPaginacion = {
  total: number;

  page: number;

  limit: number;

  totalPages: number;
};

/** Contrato HTTP de todo listado paginado: `{ data, meta }`. */
export type RespuestaPaginada<T> = {
  data: T[];

  meta: MetaPaginacion;
};

/**
 * Aplica valores por defecto y límites. Valores inválidos (no enteros,
 * < 1) caen al valor por defecto; `limit` se recorta a `limiteMaximo`.
 */
export function normalizarPaginacion(
  entrada: { page?: number | null; limit?: number | null },
  opciones: { limitePorDefecto?: number; limiteMaximo?: number } = {},
): Paginacion {
  const limiteMaximo = opciones.limiteMaximo ?? LIMITE_MAXIMO;
  const limitePorDefecto = Math.min(
    opciones.limitePorDefecto ?? LIMITE_POR_DEFECTO,
    limiteMaximo,
  );

  const page = esEnteroPositivo(entrada.page)
    ? entrada.page
    : PAGINA_POR_DEFECTO;

  const limit = esEnteroPositivo(entrada.limit)
    ? Math.min(entrada.limit, limiteMaximo)
    : limitePorDefecto;

  return { page, limit };
}

/** `skip`/`take` para Prisma (solo se usa en infra). */
export function aDesplazamiento(paginacion: Paginacion): {
  skip: number;
  take: number;
} {
  return {
    skip: (paginacion.page - 1) * paginacion.limit,
    take: paginacion.limit,
  };
}

export function calcularTotalPaginas(total: number, limit: number): number {
  if (total <= 0 || limit <= 0) return 0;

  return Math.ceil(total / limit);
}

export function crearResultadoPaginado<T>(
  items: T[],
  total: number,
  paginacion: Paginacion,
): ResultadoPaginado<T> {
  return { items, total, page: paginacion.page, limit: paginacion.limit };
}

/** Convierte el resultado del puerto al contrato HTTP con el presenter dado. */
export function presentarPaginado<T, R>(
  resultado: ResultadoPaginado<T>,
  presentar: (item: T) => R,
): RespuestaPaginada<R> {
  return {
    data: resultado.items.map((item) => presentar(item)),
    meta: {
      total: resultado.total,
      page: resultado.page,
      limit: resultado.limit,
      totalPages: calcularTotalPaginas(resultado.total, resultado.limit),
    },
  };
}

function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 1;
}
