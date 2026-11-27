export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  /** Depósito o transferencia: exige el número de boleta o transferencia. */
  DEPOSITO = 'DEPOSITO',
  PAYPAL = 'PAYPAL',
  PENDIENTE = 'PENDIENTE',
  OTRO = 'OTRO',
}
