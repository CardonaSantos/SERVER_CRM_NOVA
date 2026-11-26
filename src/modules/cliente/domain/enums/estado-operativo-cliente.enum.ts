/** Estado operativo: lo definen PPPoE, las desinstalaciones y el ajuste manual. */
export enum EstadoOperativoCliente {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  DESINSTALADO = 'DESINSTALADO',
  PENDIENTE_ACTIVO = 'PENDIENTE_ACTIVO',
  EN_INSTALACION = 'EN_INSTALACION',
}

/** Valores históricos de cobranza: solo se aceptan al leer registros antiguos. */
export enum EstadoOperativoLegacy {
  PAGO_PENDIENTE = 'PAGO_PENDIENTE',
  ATRASADO = 'ATRASADO',
  MOROSO = 'MOROSO',
}

export type EstadoClientePersistido =
  | EstadoOperativoCliente
  | EstadoOperativoLegacy;
