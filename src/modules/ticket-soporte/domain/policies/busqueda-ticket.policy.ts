const MAXIMO_ENTERO = 2_147_483_647;
const DIGITOS_MINIMOS_TELEFONO = 4;
const PARECE_TELEFONO = /^[\d\s+()-]{6,}$/;

export type CriterioBusqueda = {
  /** Texto tal como llegó, para buscar en título y descripción. */
  texto: string;
  /** Número de ticket, si lo escrito puede serlo. */
  id: number | null;
  /** Dígitos a buscar en los teléfonos del cliente. */
  telefono: string | null;
  /** Palabras que deben aparecer en el nombre o los apellidos del cliente. */
  palabras: string[];
};

/** Decide qué se busca según lo escrito: número de ticket, teléfono o texto. */
export function interpretarBusqueda(
  busqueda: string | null | undefined,
): CriterioBusqueda | null {
  const texto = busqueda?.trim();
  if (!texto) return null;

  const sinNumeral = texto.replace(/^#\s*/, '');

  if (/^\d+$/.test(sinNumeral)) {
    const numero = Number(sinNumeral);

    return {
      texto: sinNumeral,
      id: numero > 0 && numero <= MAXIMO_ENTERO ? numero : null,
      telefono:
        !texto.startsWith('#') && sinNumeral.length >= DIGITOS_MINIMOS_TELEFONO
          ? sinNumeral
          : null,
      palabras: [],
    };
  }

  if (PARECE_TELEFONO.test(texto)) {
    const digitos = texto.replace(/\D/g, '');

    return {
      texto,
      id: null,
      telefono: digitos.length >= DIGITOS_MINIMOS_TELEFONO ? digitos : null,
      palabras: [],
    };
  }

  return {
    texto,
    id: null,
    telefono: null,
    palabras: texto.split(/\s+/),
  };
}
