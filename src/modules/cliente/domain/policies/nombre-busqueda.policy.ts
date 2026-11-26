/**
 * Texto con el que se busca a un cliente: nombre y apellidos sin tildes, en
 * minúsculas y con espacios simples. Quien busque debe normalizar igual.
 */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function construirNombreBusqueda(
  nombre: string,
  apellidos: string | null,
): string {
  return normalizarBusqueda(`${nombre} ${apellidos ?? ''}`);
}
