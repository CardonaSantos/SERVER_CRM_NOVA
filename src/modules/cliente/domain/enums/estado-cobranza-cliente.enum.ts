/** Cobranza: sale solo de las facturas; el estado operativo no depende de ella. */
export enum EstadoCobranzaCliente {
  AL_DIA = 'AL_DIA',
  PAGO_PENDIENTE = 'PAGO_PENDIENTE',
  ATRASADO = 'ATRASADO',
  MOROSO = 'MOROSO',
}
