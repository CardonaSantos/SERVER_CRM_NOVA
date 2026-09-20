export interface ClienteReporteEvolucionMes {
  anio: number;

  /**
   * 1 = enero
   * 12 = diciembre
   */
  mes: number;

  etiqueta: string;

  altas: number;

  bajas: number;

  crecimientoNeto: number;
}
