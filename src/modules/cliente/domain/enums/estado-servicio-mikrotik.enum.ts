/** Marca heredada del router asignado; el control real del servicio es PPPoE. */
export enum EstadoServicioMikrotik {
  SIN_MIKROTIK = 'SIN_MIKROTIK',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  PENDIENTE_APLICAR = 'PENDIENTE_APLICAR',
  ERROR = 'ERROR',
}
