import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
  ValorResumen,
} from './tareas-programadas.types';

export const TAREAS_PROGRAMADAS = Symbol('TAREAS_PROGRAMADAS');

/**
 * Candado, registro y reintento para todo trabajo programado (guía de
 * cobranza §4.4). Los módulos le entregan su trabajo; no conoce a ninguno.
 */
export interface TareasProgramadasPort {
  /**
   * Ejecuta `trabajo` una sola vez por `clave`, aunque se llame varias veces o
   * desde varias instancias. Salta lo completado y lo que otra ejecución tiene
   * en curso; retoma lo abandonado o fallido con intentos disponibles.
   *
   * Un error dentro de `trabajo` no se propaga: deja la ejecución `FALLIDA`
   * (con reintento programado) y se informa en el resultado. Solo se propaga
   * un fallo al leer o escribir el registro.
   */
  ejecutarTarea(input: EjecutarTareaInput): Promise<ResultadoTareaProgramada>;
}

export type EjecutarTareaInput = {
  /** Identifica la intención: `LIMPIEZA:2027-03-06`, `EVALUAR_MORA:zona-3:2027-03-06`. */
  clave: string;
  /** Nombre estable, en mayúsculas: `LIMPIEZA`, `EVALUAR_MORA`. */
  tarea: string;
  /** `YYYY-MM-DD` de Guatemala al que pertenece la ejecución. */
  fechaOperativa: string;
  facturacionZonaId?: number | null;
  /** Por defecto `PROGRAMADA`. */
  origen?: OrigenEjecucionTarea;
  /** Quien la lanzó a mano. */
  ejecutadaPorId?: number | null;
  trabajo: (contexto: ContextoTareaProgramada) => Promise<void>;
};

/** Lo que recibe el trabajo para informar su avance. */
export interface ContextoTareaProgramada {
  readonly ejecucionId: number;
  readonly fechaOperativa: string;
  readonly intento: number;
  /** Suma elementos procesados (clientes, facturas, mensajes). */
  contarProcesados(cantidad?: number): void;
  /**
   * Anota que un elemento falló y deja seguir con los demás. Solo ids y
   * códigos: `registrarError('cliente-12', 'FACTURACION_SIN_PLAN')`.
   */
  registrarError(referencia: string, codigo: string): void;
  /** Un dato del resumen (conteos, banderas). Nunca datos personales. */
  anotar(nombre: string, valor: ValorResumen): void;
  /**
   * `false` si otra ejecución retomó la tarea (el arriendo se perdió): el
   * trabajo debe parar en cuanto pueda.
   */
  sigueVigente(): boolean;
}

export type MotivoOmisionTarea =
  /** Interruptor global apagado. */
  | 'APAGADO'
  | 'COMPLETADA'
  | 'EN_CURSO'
  /** Fallida; su reintento todavía no llega. */
  | 'EN_ESPERA'
  /** Sin intentos disponibles para esta clave. */
  | 'AGOTADA';

export type ResultadoTareaProgramada =
  | {
      resultado: 'EJECUTADA';
      ejecucionId: number;
      estado: EstadoEjecucionTarea;
      errorCodigo: string | null;
    }
  | {
      resultado: 'OMITIDA';
      motivo: MotivoOmisionTarea;
      ejecucionId: number | null;
    };
