export function normalizarTexto(value?: string | null): string {
  if (!value) return '';

  return value
    .normalize('NFD') // separa letra y tilde
    .replace(/[\u0300-\u036f]/g, '') // elimina las tildes
    .toLowerCase() // minúsculas
    .replace(/\s+/g, ' ') // colapsa espacios múltiples
    .trim();
}
