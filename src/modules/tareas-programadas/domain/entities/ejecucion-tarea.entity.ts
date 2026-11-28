import {
  EstadoEjecucionTarea,
  SituacionEjecucionTarea,
} from '../enums/ejecucion-tarea.enum';
import {
  EjecucionTareaEstadoInvalidoError,
  EjecucionTareaInvalidaError,
} from '../errors/tareas-programadas.errors';
import {
  LONGITUD_MAXIMA_MENSAJE_ERROR,
  MAXIMO_INTENTOS_TAREA,
  siguienteReintento,
  vencimientoArriendo,
} from '../policies/arriendo.policy';
import {
  EjecucionTareaProps,
  IniciarEjecucionTareaProps,
  QuienEjecutaTarea,
  ResultadoParcialTarea,
  ResumenEjecucionTarea,
} from '../props/ejecucion-tarea.props';

const NOMBRE_TAREA = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const TERMINADAS = new Set([
  EstadoEjecucionTarea.COMPLETADA,
  EstadoEjecucionTarea.COMPLETADA_CON_ERRORES,
]);

/**
 * Una ejecución de una tarea programada. Su fila es también el candado:
 * `intentos` funciona como versión, así que quien la retoma deja sin efecto
 * las escrituras del que la tenía antes.
 */
export class EjecucionTareaEntity {
  private constructor(private props: EjecucionTareaProps) {}

  static iniciar(
    input: IniciarEjecucionTareaProps,
    ahora: Date,
  ): EjecucionTareaEntity {
    const props: EjecucionTareaProps = {
      id: null,
      clave: input.clave.trim(),
      tarea: input.tarea,
      facturacionZonaId: input.facturacionZonaId ?? null,
      fechaOperativa: input.fechaOperativa,
      origen: input.origen,
      ejecutadaPorId: input.ejecutadaPorId ?? null,
      estado: EstadoEjecucionTarea.EJECUTANDO,
      intentos: 1,
      bloqueadoHasta: vencimientoArriendo(ahora),
      siguienteIntentoEn: null,
      iniciadaEn: new Date(ahora),
      finalizadaEn: null,
      procesados: 0,
      errores: 0,
      resumen: null,
      errorCodigo: null,
      errorMensaje: null,
    };
    EjecucionTareaEntity.assertConsistencia(props);
    return new EjecucionTareaEntity(props);
  }

  static hydrate(props: EjecucionTareaProps): EjecucionTareaEntity {
    EjecucionTareaEntity.assertConsistencia(props);
    return new EjecucionTareaEntity({ ...props });
  }

  /**
   * Qué hacer con esta ejecución ahora. Una ejecución abandonada cuenta como
   * un intento: así una tarea que tumba el proceso no se repite sin fin.
   * `ignorarLimites` (ejecución manual) retoma aunque falte la espera o se
   * hayan agotado los intentos; nunca toma una en curso ni una completada.
   */
  situacion(
    ahora: Date,
    opciones: { ignorarLimites?: boolean } = {},
  ): SituacionEjecucionTarea {
    const { estado, bloqueadoHasta, siguienteIntentoEn, intentos } = this.props;

    if (TERMINADAS.has(estado)) return SituacionEjecucionTarea.COMPLETADA;

    if (estado === EstadoEjecucionTarea.EJECUTANDO) {
      if (bloqueadoHasta && bloqueadoHasta.getTime() > ahora.getTime()) {
        return SituacionEjecucionTarea.EN_CURSO;
      }
    } else if (
      !opciones.ignorarLimites &&
      siguienteIntentoEn &&
      siguienteIntentoEn.getTime() > ahora.getTime()
    ) {
      return SituacionEjecucionTarea.EN_ESPERA;
    }

    if (!opciones.ignorarLimites && intentos >= MAXIMO_INTENTOS_TAREA) {
      return SituacionEjecucionTarea.AGOTADA;
    }
    return SituacionEjecucionTarea.RETOMABLE;
  }

  /** Toma de nuevo una ejecución abandonada o fallida. */
  retomar(
    quien: QuienEjecutaTarea,
    ahora: Date,
    opciones: { ignorarLimites?: boolean } = {},
  ): void {
    if (this.situacion(ahora, opciones) !== SituacionEjecucionTarea.RETOMABLE) {
      throw new EjecucionTareaEstadoInvalidoError();
    }
    this.props = {
      ...this.props,
      origen: quien.origen,
      ejecutadaPorId: quien.ejecutadaPorId,
      estado: EstadoEjecucionTarea.EJECUTANDO,
      intentos: this.props.intentos + 1,
      bloqueadoHasta: vencimientoArriendo(ahora),
      siguienteIntentoEn: null,
      finalizadaEn: null,
      procesados: 0,
      errores: 0,
      resumen: null,
    };
  }

  renovarArriendo(ahora: Date): void {
    this.assertEjecutando();
    this.props.bloqueadoHasta = vencimientoArriendo(ahora);
  }

  completar(resultado: ResultadoParcialTarea, ahora: Date): void {
    this.assertEjecutando();
    this.props = {
      ...this.props,
      ...EjecucionTareaEntity.conteos(resultado),
      estado:
        resultado.errores > 0
          ? EstadoEjecucionTarea.COMPLETADA_CON_ERRORES
          : EstadoEjecucionTarea.COMPLETADA,
      bloqueadoHasta: null,
      siguienteIntentoEn: null,
      finalizadaEn: new Date(ahora),
      errorCodigo: null,
      errorMensaje: null,
    };
  }

  /**
   * La tarea entera falló. El mensaje debe ser seguro: el de un DomainError o
   * uno genérico, nunca el error técnico.
   */
  fallar(
    error: { codigo: string; mensaje: string },
    resultado: ResultadoParcialTarea,
    ahora: Date,
  ): void {
    this.assertEjecutando();
    const quedanIntentos = this.props.intentos < MAXIMO_INTENTOS_TAREA;
    this.props = {
      ...this.props,
      ...EjecucionTareaEntity.conteos(resultado),
      estado: EstadoEjecucionTarea.FALLIDA,
      bloqueadoHasta: null,
      siguienteIntentoEn: quedanIntentos ? siguienteReintento(ahora) : null,
      finalizadaEn: new Date(ahora),
      errorCodigo: error.codigo,
      errorMensaje: error.mensaje.slice(0, LONGITUD_MAXIMA_MENSAJE_ERROR),
    };
  }

  get id(): number | null {
    return this.props.id;
  }

  get clave(): string {
    return this.props.clave;
  }

  get tarea(): string {
    return this.props.tarea;
  }

  get estado(): EstadoEjecucionTarea {
    return this.props.estado;
  }

  get intentos(): number {
    return this.props.intentos;
  }

  get fechaOperativa(): string {
    return this.props.fechaOperativa;
  }

  get bloqueadoHasta(): Date | null {
    return this.props.bloqueadoHasta
      ? new Date(this.props.bloqueadoHasta)
      : null;
  }

  get errorCodigo(): string | null {
    return this.props.errorCodigo;
  }

  toPrimitives(): EjecucionTareaProps {
    return { ...this.props };
  }

  private assertEjecutando(): void {
    if (this.props.estado !== EstadoEjecucionTarea.EJECUTANDO) {
      throw new EjecucionTareaEstadoInvalidoError();
    }
  }

  private static conteos(resultado: ResultadoParcialTarea): {
    procesados: number;
    errores: number;
    resumen: ResumenEjecucionTarea | null;
  } {
    return {
      procesados: Math.max(0, Math.trunc(resultado.procesados)),
      errores: Math.max(0, Math.trunc(resultado.errores)),
      resumen: resultado.resumen,
    };
  }

  private static assertConsistencia(props: EjecucionTareaProps): void {
    if (!props.clave || props.clave.length > 200) {
      throw new EjecucionTareaInvalidaError(
        'La clave de la tarea debe tener entre 1 y 200 caracteres.',
      );
    }
    if (!NOMBRE_TAREA.test(props.tarea)) {
      throw new EjecucionTareaInvalidaError(
        'El nombre de la tarea debe ir en mayúsculas y guiones bajos.',
      );
    }
    if (!esFecha(props.fechaOperativa)) {
      throw new EjecucionTareaInvalidaError(
        'La fecha operativa debe tener el formato AAAA-MM-DD.',
      );
    }
    if (!Number.isInteger(props.intentos) || props.intentos < 1) {
      throw new EjecucionTareaInvalidaError(
        'Los intentos de una tarea empiezan en 1.',
      );
    }
    if (
      props.estado === EstadoEjecucionTarea.EJECUTANDO &&
      !props.bloqueadoHasta
    ) {
      throw new EjecucionTareaInvalidaError(
        'Una tarea en ejecución necesita su arriendo.',
      );
    }
  }
}

function esFecha(valor: string): boolean {
  if (!FECHA.test(valor)) return false;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const utc = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    utc.getUTCFullYear() === anio &&
    utc.getUTCMonth() === mes - 1 &&
    utc.getUTCDate() === dia
  );
}
