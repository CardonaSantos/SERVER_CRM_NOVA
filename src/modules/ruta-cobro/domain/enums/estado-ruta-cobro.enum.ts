export enum EstadoRutaCobro {
  ACTIVO = 'ACTIVO',
  ASIGNADA = 'ASIGNADA',
  EN_CURSO = 'EN_CURSO',
  CERRADO = 'CERRADO',
  CANCELADO = 'CANCELADO',
}

/** Estados en los que una ruta se trabaja y admite cobros. */
export const ESTADOS_RUTA_ABIERTA: readonly EstadoRutaCobro[] = [
  EstadoRutaCobro.ACTIVO,
  EstadoRutaCobro.ASIGNADA,
  EstadoRutaCobro.EN_CURSO,
];
