import { BadRequestException } from '@nestjs/common';

/**
 * Verifica que un objeto contenga todas las propiedades requeridas
 * y que no estén vacías (undefined, null o string vacío).
 *
 * @param obj - Objeto a validar (por ejemplo un DTO o payload)
 * @param keyProps - Lista de propiedades requeridas
 * @throws BadRequestException si alguna propiedad está ausente o vacía
 */
export function verifyProps<T extends Record<string, any>>(
  obj: T,
  keyProps: (keyof T)[],
): void {
  const isEmpty = (v: unknown): boolean =>
    v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

  const faltantes = keyProps.filter((k) => isEmpty(obj[k]));

  if (faltantes.length > 0) {
    throw new BadRequestException(
      `Propiedades faltantes o vacías: ${faltantes.join(', ')}`,
    );
  }
}
