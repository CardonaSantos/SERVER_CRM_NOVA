/**
 * Con qué se compara un número de boleta o transferencia: el mismo número
 * escrito con otros espacios o mayúsculas es el mismo.
 */
export const claveNumeroBoleta = (numero: string): string =>
  numero.replace(/\s+/g, '').toLowerCase();
