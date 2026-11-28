import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../enums/ejecucion-tarea.enum';

export type ValorResumen = number | string | boolean | null;

export type ErrorElementoTarea = {
  /** Qué elemento falló, solo con ids: `cliente-12`, `factura-9921`. */
  referencia: string;
  codigo: string;
};

/** Lo que dejó el último intento. Nunca lleva datos personales. */
export type ResumenEjecucionTarea = {
  datos: Record<string, ValorResumen>;
  erroresDetalle: ErrorElementoTarea[];
  /** Errores que no entraron al detalle por el límite. */
  erroresOmitidos: number;
};

export type ResultadoParcialTarea = {
  procesados: number;
  errores: number;
  resumen: ResumenEjecucionTarea | null;
};

export type EjecucionTareaProps = {
  id: number | null;
  clave: string;
  tarea: string;
  facturacionZonaId: number | null;
  /** `YYYY-MM-DD` de Guatemala. */
  fechaOperativa: string;
  origen: OrigenEjecucionTarea;
  ejecutadaPorId: number | null;
  estado: EstadoEjecucionTarea;
  intentos: number;
  bloqueadoHasta: Date | null;
  siguienteIntentoEn: Date | null;
  iniciadaEn: Date;
  finalizadaEn: Date | null;
  procesados: number;
  errores: number;
  resumen: ResumenEjecucionTarea | null;
  errorCodigo: string | null;
  errorMensaje: string | null;
};

export type IniciarEjecucionTareaProps = {
  clave: string;
  tarea: string;
  fechaOperativa: string;
  facturacionZonaId?: number | null;
  origen: OrigenEjecucionTarea;
  ejecutadaPorId?: number | null;
};

export type QuienEjecutaTarea = {
  origen: OrigenEjecucionTarea;
  ejecutadaPorId: number | null;
};

/** Límites de reintento de una clave. */
export type LimitesEjecucionTarea = {
  /** Ejecución manual: retoma aunque falte la espera o no queden intentos. */
  ignorarLimites?: boolean;
  /**
   * Intentos permitidos (1 a 3; por defecto 3). Con 1, lo fallido o abandonado
   * no se retoma: para trabajos que no se pueden repetir sin efectos dobles.
   */
  maximoIntentos?: number;
};
