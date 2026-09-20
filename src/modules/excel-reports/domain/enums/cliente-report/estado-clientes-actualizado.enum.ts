export const EstadoCliente = {
  ACTIVO: 'ACTIVO',
  SUSPENDIDO: 'SUSPENDIDO',
  DESINSTALADO: 'DESINSTALADO',
  PENDIENTE_ACTIVO: 'PENDIENTE_ACTIVO',
  EN_INSTALACION: 'EN_INSTALACION',

  // Legacy: existen en BD, pero no deben utilizarse
  // para representar el estado operativo actual.
  PAGO_PENDIENTE: 'PAGO_PENDIENTE',
  ATRASADO: 'ATRASADO',
  MOROSO: 'MOROSO',
} as const;

export type EstadoCliente = (typeof EstadoCliente)[keyof typeof EstadoCliente];
