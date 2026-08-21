export type FacturacionReporteAgingBucket =
  | 'POR_VENCER'
  | '1_30_DIAS'
  | '31_60_DIAS'
  | '61_90_DIAS'
  | '91_180_DIAS'
  | 'MAS_180_DIAS'
  | 'SIN_FECHA';

export interface FacturacionReporteAgingRow {
  bucket: FacturacionReporteAgingBucket;

  etiqueta: string;

  facturas: number;

  clientes: number;

  saldoPendiente: number;

  porcentajeCartera: number;
}

export interface FacturacionReporteCarteraZonaRow {
  facturacionZonaId: number | null;

  zona: string;

  facturasPendientes: number;

  clientesConDeuda: number;

  saldoPendiente: number;

  saldoVencido: number;

  saldoPorVencer: number;

  saldoSinFechaVencimiento: number;

  porcentajeCartera: number;
}

export interface FacturacionReporteCarteraClienteRow {
  clienteId: number;

  cliente: string;

  /**
   * Un cliente puede tener deuda histórica
   * asociada a más de una zona.
   */
  zonas: string[];

  facturasPendientes: number;

  facturasVencidas: number;

  fechaPagoEsperadaMasAntigua: Date | null;

  diasMoraMaximos: number | null;

  saldoVencido: number;

  saldoPorVencer: number;

  saldoSinFechaVencimiento: number;

  totalPendiente: number;
}

export interface FacturacionReporteCartera {
  aging: FacturacionReporteAgingRow[];

  porZona: FacturacionReporteCarteraZonaRow[];

  /**
   * Todos los clientes con saldo pendiente,
   * ordenados de mayor a menor deuda.
   *
   * El XLSX puede decidir mostrar solamente
   * los primeros 10 en una tabla resumida.
   */
  clientes: FacturacionReporteCarteraClienteRow[];
}
