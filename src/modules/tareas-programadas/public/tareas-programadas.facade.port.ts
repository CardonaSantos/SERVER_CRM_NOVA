import {
  EstadoEjecucionTarea,
  FaseJornada,
  MomentoJornada,
  OrigenEjecucionTarea,
  ValorResumen,
} from './tareas-programadas.types';

export const TAREAS_PROGRAMADAS = Symbol('TAREAS_PROGRAMADAS');

/**
 * Candado, registro y reintento para todo trabajo programado (guía de
 * cobranza §4). Los módulos le entregan su trabajo; no conoce a ninguno.
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

  /**
   * Suma una etapa a la jornada diaria (10:00, Guatemala). Se llama al
   * iniciar el módulo dueño. La jornada recorre las etapas por fase y orden;
   * el repaso (cada 30 min hasta las 17:30) las vuelve a llamar para retomar
   * lo fallido, así que una etapa debe apoyarse en `ejecutarPaso` para no
   * repetir lo ya hecho. Lanza `TAREA_PROGRAMADA_ETAPA_INVALIDA` si el nombre,
   * la fase o el orden no son válidos o si la etapa ya existe en esa fase.
   */
  registrarEtapa(input: RegistrarEtapaInput): void;

  /**
   * Permite que un super administrador lance la tarea a mano
   * (`POST /tareas-programadas/:tarea/ejecutar`). Solo para tareas que se
   * pueden repetir sin efectos dobles y que no tocan clientes ni routers.
   * Lanza `TAREA_PROGRAMADA_INVALIDA` si el nombre no es válido o ya existe.
   */
  registrarTareaManual(input: RegistrarTareaManualInput): void;
}

export type RegistrarTareaManualInput = {
  /** Mismo nombre que usa en `ejecutarTarea`. */
  tarea: string;
  /** Qué hace, para la pantalla. */
  descripcion: string;
  /**
   * La corre con su clave de hoy, con `origen: MANUAL` y quien la lanzó.
   * Devuelve lo que devolvió `ejecutarTarea`.
   */
  ejecutar: (quien: {
    ejecutadaPorId: number;
  }) => Promise<ResultadoTareaProgramada>;
};

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
  /**
   * `false` para un trabajo que no se puede repetir sin efectos dobles (envía
   * mensajes sin registro propio): tiene un solo intento y, si falla o el
   * proceso muere a la mitad, no se retoma solo. Por defecto `true`.
   */
  reintentable?: boolean;
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

export type RegistrarEtapaInput = {
  /** Nombre estable, en mayúsculas: `GENERAR_FACTURAS`. */
  tarea: string;
  fase: FaseJornada;
  /** Posición dentro de la fase (menor primero). */
  orden: number;
  /**
   * Hace la etapa, normalmente un `ejecutarPaso` por zona. Si lanza, la
   * jornada lo anota y sigue con la siguiente etapa.
   */
  ejecutar: (contexto: ContextoEtapaJornada) => Promise<void>;
};

/** Lo que recibe una etapa de la jornada. */
export interface ContextoEtapaJornada {
  /** `YYYY-MM-DD` de Guatemala de la jornada. */
  readonly fechaOperativa: string;
  readonly momento: MomentoJornada;
  /** `true` entre las 10:00 y las 18:00 de Guatemala. */
  dentroDeVentana(): boolean;
  /**
   * Un paso de la etapa (por zona) con su propio candado y registro, con la
   * fecha de la jornada. Fuera de la ventana no empieza (`FUERA_DE_VENTANA`).
   */
  ejecutarPaso(input: EjecutarPasoInput): Promise<ResultadoTareaProgramada>;
}

export type EjecutarPasoInput = Omit<
  EjecutarTareaInput,
  'fechaOperativa' | 'origen' | 'ejecutadaPorId'
>;

export type MotivoOmisionTarea =
  /** Interruptor global apagado. */
  | 'APAGADO'
  | 'COMPLETADA'
  | 'EN_CURSO'
  /** Fallida; su reintento todavía no llega. */
  | 'EN_ESPERA'
  /** Sin intentos disponibles para esta clave. */
  | 'AGOTADA'
  /** Toca clientes y ya no es horario (10:00–18:00 de Guatemala). */
  | 'FUERA_DE_VENTANA';

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
