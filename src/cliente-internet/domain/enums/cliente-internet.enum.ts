/** Estados operativos permitidos para flujos nuevos. */
export enum EstadoOperativoCliente {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  DESINSTALADO = 'DESINSTALADO',
  PENDIENTE_ACTIVO = 'PENDIENTE_ACTIVO',
  EN_INSTALACION = 'EN_INSTALACION',
}

/** Valores históricos: solo se aceptan al hidratar registros antiguos. */
export enum EstadoOperativoLegacy {
  PAGO_PENDIENTE = 'PAGO_PENDIENTE',
  ATRASADO = 'ATRASADO',
  MOROSO = 'MOROSO',
}
export type EstadoClientePersistido =
  | EstadoOperativoCliente
  | EstadoOperativoLegacy;

export enum EstadoCobranzaClienteDomain {
  AL_DIA = 'AL_DIA',
  PAGO_PENDIENTE = 'PAGO_PENDIENTE',
  ATRASADO = 'ATRASADO',
  MOROSO = 'MOROSO',
}
