export const LARGO_MAXIMO_NOMBRE = 100;
export const LARGO_MAXIMO_DESCRIPCION = 500;

type CrearError = (mensaje: string) => Error;

export function exigirNombre(nombre: string, error: CrearError): string {
  const limpio = nombre.trim();
  if (limpio === '' || limpio.length > LARGO_MAXIMO_NOMBRE) {
    throw error(
      `El nombre es obligatorio y admite hasta ${LARGO_MAXIMO_NOMBRE} caracteres.`,
    );
  }

  return limpio;
}

/** Un texto vacío equivale a no tener valor. */
export function textoOpcional(
  texto: string | null | undefined,
  campo: string,
  maximo: number,
  error: CrearError,
): string | null {
  const limpio = texto?.trim() ?? '';
  if (limpio.length > maximo) {
    throw error(`${campo} admite hasta ${maximo} caracteres.`);
  }

  return limpio === '' ? null : limpio;
}

/** Cero es válido (hay planes sin costo); nunca negativo ni con más de 2 decimales. */
export function exigirPrecio(precio: number, error: CrearError): number {
  const centavos = precio * 100;
  if (
    !Number.isFinite(precio) ||
    precio < 0 ||
    Math.abs(centavos - Math.round(centavos)) > 1e-6
  ) {
    throw error('El precio debe ser 0 o mayor, con hasta 2 decimales.');
  }

  return precio;
}

/** Dos nombres que solo difieren en mayúsculas o espacios son el mismo. */
export function mismoNombre(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
