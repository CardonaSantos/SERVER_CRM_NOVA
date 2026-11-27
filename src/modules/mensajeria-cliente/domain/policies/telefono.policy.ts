/** E.164 admite hasta 15 dígitos; más largo suele ser dos números pegados. */
const DIGITOS_MAXIMOS = 15;

/**
 * Números para WhatsApp a partir de campos de teléfono, que pueden traer
 * varios separados por coma. Ocho dígitos son de Guatemala (502). No quita
 * repetidos.
 */
export function normalizarTelefonos(
  crudos: Array<string | null | undefined>,
): string[] {
  return crudos
    .flatMap((crudo) => (crudo ?? '').split(','))
    .map((parte) => parte.replace(/\D/g, ''))
    .map((digitos) => (digitos.length === 8 ? `502${digitos}` : digitos))
    .filter((digitos) => digitos.length >= 10);
}

export function esTelefonoEntregable(telefono: string): boolean {
  return telefono.length <= DIGITOS_MAXIMOS;
}
