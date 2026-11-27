export enum EstadoFactura {
  PENDIENTE = 'PENDIENTE',
  PARCIAL = 'PARCIAL',
  VENCIDA = 'VENCIDA',
  PAGADA = 'PAGADA',
  ANULADA = 'ANULADA',
}

/** Estados en los que una factura todavía se debe. */
export const ESTADOS_CON_DEUDA: readonly EstadoFactura[] = [
  EstadoFactura.PENDIENTE,
  EstadoFactura.PARCIAL,
  EstadoFactura.VENCIDA,
];
