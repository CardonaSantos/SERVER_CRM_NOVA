/** Cuánto lleva vencida una factura sin pagar. */
export enum TramoDeuda {
  POR_VENCER = 'POR_VENCER',
  DE_1_A_30 = 'DE_1_A_30',
  DE_31_A_60 = 'DE_31_A_60',
  DE_61_A_90 = 'DE_61_A_90',
  MAS_DE_90 = 'MAS_DE_90',
  SIN_FECHA = 'SIN_FECHA',
}
