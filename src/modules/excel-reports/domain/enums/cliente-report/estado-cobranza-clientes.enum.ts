export const EstadoCobranzaCliente = {
  AL_DIA: 'AL_DIA',
  PAGO_PENDIENTE: 'PAGO_PENDIENTE',
  ATRASADO: 'ATRASADO',
  MOROSO: 'MOROSO',
} as const;

export type EstadoCobranzaCliente =
  (typeof EstadoCobranzaCliente)[keyof typeof EstadoCobranzaCliente];
