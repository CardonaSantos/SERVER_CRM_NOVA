import { AgrupacionUbicacion } from '../enums/agrupacion-ubicacion.enum';

export type ClienteConPlan = {
  /** `ACTIVO` o `SUSPENDIDO`. */
  activo: boolean;
  tieneZona: boolean;
  tieneFechaDesinstalacion: boolean;
  plan: { id: number; nombre: string; precio: number } | null;
};

export type ClientesPorPlanReadModel = {
  planes: Array<{
    planId: number;
    nombre: string;
    precio: number;
    clientesFacturables: number;
    clientesSuspendidos: number;
    ingresoMensualEsperado: number;
  }>;
  /** Clientes activos a los que no se les genera factura, y por qué. */
  activosSinFacturar: {
    sinPlan: number;
    sinZona: number;
    conFechaDeDesinstalacion: number;
  };
  totales: {
    clientesFacturables: number;
    clientesSuspendidos: number;
    ingresoMensualEsperado: number;
  };
};

export type ClienteUbicado = {
  id: number;
  grupo: { id: number; nombre: string } | null;
};

export type FilaUbicacion = {
  /** `null` agrupa a quienes no tienen ese dato. */
  id: number | null;
  nombre: string;
  clientes: number;
  clientesConDeudaVencida: number;
  deuda: number;
  deudaVencida: number;
};

export type ClientesPorUbicacionReadModel = {
  agrupar: AgrupacionUbicacion;
  corte: string;
  grupos: FilaUbicacion[];
  totales: Omit<FilaUbicacion, 'id' | 'nombre'>;
};
