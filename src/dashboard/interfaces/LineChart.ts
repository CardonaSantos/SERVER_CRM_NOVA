export interface ChartDatum {
  x: string; // Ej: "plane", "helicopter", o una fecha "2023-01-01"
  y: number; // Ej: 168, 82
}

//  La estructura de cada serie (País o métrica como "Instalaciones")
export interface ChartSeries {
  id: string; // Ej: "japan", "france" (o "Instalaciones")
  data: ChartDatum[]; // Array de puntos
  color?: string; // Opcional: si quieres forzar un color específico aquí
}

//  El tipo final para tu conjunto de datos completo
export type ChartData = ChartSeries[];
