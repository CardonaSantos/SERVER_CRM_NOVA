import { Transform } from 'class-transformer';

/**
 * Conversiones explícitas para query strings (el pipe global no hace
 * conversión implícita). Usar junto con los validadores de class-validator.
 */

/**
 * `?estados=A` → ['A']; `?estados=A&estados=B` → ['A', 'B'];
 * `?estados=A,B` → ['A', 'B']. Sin valor → undefined.
 *
 * @example
 * @IsOptional() @ComoArreglo() @IsEnum(EstadoCliente, { each: true })
 * estados?: EstadoCliente[];
 */
export const ComoArreglo = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const lista = Array.isArray(value) ? value : [value];

    return lista
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
      .map((v) => (typeof v === 'string' ? v.trim() : v))
      .filter((v) => v !== '');
  });

/**
 * 'true'/'1' → true, 'false'/'0' → false. Cualquier otro texto se deja
 * igual para que `@IsBoolean()` lo rechace (nunca se adivina).
 *
 * @example
 * @IsOptional() @ComoBooleano() @IsBoolean()
 * activo?: boolean;
 */
export const ComoBooleano = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean' || value === undefined) return value;

    if (value === 'true' || value === '1') return true;

    if (value === 'false' || value === '0') return false;

    return value;
  });

/** Recorta espacios; un texto vacío queda como undefined. */
export const Recortar = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;

    const texto = value.trim();

    return texto === '' ? undefined : texto;
  });
