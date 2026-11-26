export type Coordenadas = { latitud: number; longitud: number };

/** Latitud y longitud llegan como texto; si falta alguna no hay ubicación. */
export function leerCoordenadas(
  valores: string[] | null | undefined,
): Coordenadas | null {
  const latitud = Number(valores?.[0]);
  const longitud = Number(valores?.[1]);

  return latitud && longitud ? { latitud, longitud } : null;
}
