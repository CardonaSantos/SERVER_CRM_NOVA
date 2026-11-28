export class ErrorElementoTareaResponseDto {
  /** Qué elemento falló, solo con su id: `cliente-12`, `etapa-GENERAR_FACTURAS` */
  referencia: string;
  /** Código del error */
  codigo: string;
}

export class ResumenEjecucionTareaResponseDto {
  /** Conteos y banderas que anotó la tarea */
  datos: Record<string, number | string | boolean | null>;
  /** Hasta 50 errores por elemento */
  erroresDetalle: ErrorElementoTareaResponseDto[];
  /** Errores que no entraron en el detalle */
  erroresOmitidos: number;
}

export class EjecucionTareaResponseDto {
  id: number;
  /** Identifica la intención: `LIMPIEZA_SESIONES:2027-03-06` */
  clave: string;
  /** Nombre de la tarea */
  tarea: string;
  facturacionZonaId: number | null;
  /** Día de Guatemala al que pertenece (`YYYY-MM-DD`) */
  fechaOperativa: string;
  /** `PROGRAMADA` o `MANUAL` */
  origen: string;
  /** Quién la lanzó a mano (o la retomó a mano por última vez) */
  ejecutadaPorId: number | null;
  /** `EJECUTANDO`, `COMPLETADA`, `COMPLETADA_CON_ERRORES` o `FALLIDA` */
  estado: string;
  /** En ejecución pero nadie la está corriendo (el proceso murió a la mitad) */
  abandonada: boolean;
  /** Intentos hechos con esta clave */
  intentos: number;
  /** ISO 8601 */
  iniciadaEn: string;
  /** ISO 8601 */
  finalizadaEn: string | null;
  /** Cuándo se puede reintentar sola (ISO 8601) */
  siguienteIntentoEn: string | null;
  /** Elementos procesados */
  procesados: number;
  /** Elementos con error */
  errores: number;
  /** Código si la tarea entera falló */
  errorCodigo: string | null;
  /** Mensaje para mostrar si la tarea entera falló */
  errorMensaje: string | null;
  resumen: ResumenEjecucionTareaResponseDto | null;
}

export class TareaManualResponseDto {
  /** Nombre para `POST /tareas-programadas/:tarea/ejecutar` */
  tarea: string;
  /** Qué hace */
  descripcion: string;
}

export class ResultadoTareaManualResponseDto {
  /** `EJECUTADA` o `OMITIDA` */
  resultado: string;
  /** Si se omitió, por qué: `COMPLETADA` (ya se hizo hoy), `APAGADO` (interruptor) */
  motivo: string | null;
  /** Fila del registro */
  ejecucionId: number | null;
  /** Estado al terminar, si se ejecutó */
  estado: string | null;
  /** Código si falló */
  errorCodigo: string | null;
}
