export function formatearTelefonosMeta(
  raw: (string | null | undefined)[],
): string[] {
  const planos = raw.filter(Boolean).flatMap((r) =>
    r!
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  return planos
    .map((tel) => {
      // 1. Quitar TODO lo que no sea número (incluido el +)
      const limpio = tel.replace(/\D/g, '');

      // CASO GUATEMALA (8 dígitos locales)
      // Si nos llega "12345678", le pegamos el 502.
      if (limpio.length === 8) {
        return `502${limpio}`;
      }

      // CASO NÚMERO COMPLETO (Ya trae código de país)
      // Ej: Ya venía como "50212345678" o "521..." (México)
      // Validamos una longitud mínima lógica (mínimo 10 dígitos para ser internacional válido)
      if (limpio.length >= 10) {
        return limpio;
      }

      // Si no cumple nada, es inválido
      return null;
    })
    .filter((t): t is string => !!t);
}
