import { Inject, Injectable, Logger } from '@nestjs/common';

import { esDomainError } from 'src/common/hexagonal/domain-error';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { EjecucionTareaEntity } from '../../domain/entities/ejecucion-tarea.entity';
import {
  OrigenEjecucionTarea,
  SituacionEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import {
  INTERVALO_RENOVACION_MS,
  MAXIMO_ERRORES_DETALLE,
} from '../../domain/policies/arriendo.policy';
import {
  EJECUCION_TAREA_REPOSITORY,
  EjecucionTareaRepositoryPort,
} from '../../domain/ports/ejecucion-tarea-repository.port';
import {
  ErrorElementoTarea,
  QuienEjecutaTarea,
  ResultadoParcialTarea,
  ValorResumen,
} from '../../domain/props/ejecucion-tarea.props';
import {
  ContextoTareaProgramada,
  EjecutarTareaInput,
  MotivoOmisionTarea,
  ResultadoTareaProgramada,
} from '../../public/tareas-programadas.facade.port';
import {
  TAREAS_PROGRAMADAS_CONFIG,
  TareasProgramadasConfig,
} from '../ports/tareas-programadas-config.port';
import { TEMPORIZADOR, TemporizadorPort } from '../ports/temporizador.port';

type Opciones = { ignorarLimites: boolean };
type Toma =
  | { ejecucion: EjecucionTareaEntity }
  | Extract<ResultadoTareaProgramada, { resultado: 'OMITIDA' }>;

/**
 * Candado por arriendo + registro + reintento alrededor de un trabajo (guía
 * de cobranza §4.4). Nunca abre una transacción larga: el trabajo guarda lo
 * suyo en transacciones cortas y se apoya en sus propias claves únicas para
 * que retomarlo no repita nada.
 */
@Injectable()
export class EjecutarTareaProgramadaUseCase {
  private readonly logger = new Logger(EjecutarTareaProgramadaUseCase.name);

  constructor(
    @Inject(EJECUCION_TAREA_REPOSITORY)
    private readonly ejecuciones: EjecucionTareaRepositoryPort,
    @Inject(TAREAS_PROGRAMADAS_CONFIG)
    private readonly config: TareasProgramadasConfig,
    @Inject(TEMPORIZADOR)
    private readonly temporizador: TemporizadorPort,
    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(input: EjecutarTareaInput): Promise<ResultadoTareaProgramada> {
    if (!this.config.activas) return omitida('APAGADO', null);

    const quien: QuienEjecutaTarea = {
      origen: input.origen ?? OrigenEjecucionTarea.PROGRAMADA,
      ejecutadaPorId: input.ejecutadaPorId ?? null,
    };
    // Una persona puede relanzar una fallida aunque falte la espera.
    const opciones: Opciones = {
      ignorarLimites: quien.origen === OrigenEjecucionTarea.MANUAL,
    };

    const toma = await this.tomar(input, quien, opciones);
    if ('resultado' in toma) return toma;

    return this.ejecutar(toma.ejecucion, input);
  }

  private async tomar(
    input: EjecutarTareaInput,
    quien: QuienEjecutaTarea,
    opciones: Opciones,
  ): Promise<Toma> {
    const existente = await this.ejecuciones.findByClave(input.clave);
    if (existente) return this.retomarSiSePuede(existente, quien, opciones);

    const nueva = EjecucionTareaEntity.iniciar(
      {
        clave: input.clave,
        tarea: input.tarea,
        fechaOperativa: input.fechaOperativa,
        facturacionZonaId: input.facturacionZonaId,
        ...quien,
      },
      this.reloj.ahora(),
    );
    const creada = await this.ejecuciones.crear(nueva);
    if (creada) return { ejecucion: creada };

    // Otra ejecución insertó la misma clave entre la lectura y la escritura.
    const ganadora = await this.ejecuciones.findByClave(input.clave);
    return ganadora
      ? this.retomarSiSePuede(ganadora, quien, opciones)
      : omitida('EN_CURSO', null);
  }

  private async retomarSiSePuede(
    ejecucion: EjecucionTareaEntity,
    quien: QuienEjecutaTarea,
    opciones: Opciones,
  ): Promise<Toma> {
    const ahora = this.reloj.ahora();
    const situacion = ejecucion.situacion(ahora, opciones);

    switch (situacion) {
      case SituacionEjecucionTarea.COMPLETADA:
        return omitida('COMPLETADA', ejecucion.id);
      case SituacionEjecucionTarea.EN_CURSO:
        return omitida('EN_CURSO', ejecucion.id);
      case SituacionEjecucionTarea.EN_ESPERA:
        return omitida('EN_ESPERA', ejecucion.id);
      case SituacionEjecucionTarea.AGOTADA:
        return omitida('AGOTADA', ejecucion.id);
      case SituacionEjecucionTarea.RETOMABLE: {
        const anterior = {
          estado: ejecucion.estado,
          intentos: ejecucion.intentos,
        };
        ejecucion.retomar(quien, ahora, opciones);
        const tomada = await this.ejecuciones.retomar(
          ejecucion,
          anterior,
          ahora,
        );
        if (!tomada) return omitida('EN_CURSO', ejecucion.id);

        this.logger.log(
          `[TAREA] Retomada clave=${ejecucion.clave} intento=${ejecucion.intentos}`,
        );
        return { ejecucion };
      }
      default: {
        const imposible: never = situacion;
        throw new Error(
          `Situación de tarea no contemplada: ${String(imposible)}`,
        );
      }
    }
  }

  private async ejecutar(
    ejecucion: EjecucionTareaEntity,
    input: EjecutarTareaInput,
  ): Promise<ResultadoTareaProgramada> {
    const acumulado = new AcumuladorTarea();
    let vigente = true;

    const renovacion = this.temporizador.repetir(
      INTERVALO_RENOVACION_MS,
      async () => {
        if (!vigente) return;
        try {
          ejecucion.renovarArriendo(this.reloj.ahora());
          vigente = await this.ejecuciones.renovarArriendo(ejecucion);
          if (!vigente) {
            this.logger.warn(
              `[TAREA] Arriendo perdido clave=${ejecucion.clave} intento=${ejecucion.intentos}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `[TAREA] No se pudo renovar el arriendo clave=${ejecucion.clave}: ${nombreDe(error)}`,
          );
        }
      },
    );

    const contexto: ContextoTareaProgramada = {
      ejecucionId: ejecucion.id!,
      fechaOperativa: ejecucion.fechaOperativa,
      intento: ejecucion.intentos,
      contarProcesados: (cantidad = 1) => acumulado.contar(cantidad),
      registrarError: (referencia, codigo) =>
        acumulado.registrarError(referencia, codigo),
      anotar: (nombre, valor) => acumulado.anotar(nombre, valor),
      sigueVigente: () => vigente,
    };

    let fallo: unknown = null;
    try {
      await input.trabajo(contexto);
    } catch (error) {
      fallo = error ?? new Error('Fallo sin detalle');
    } finally {
      await renovacion.detener();
    }

    const ahora = this.reloj.ahora();
    if (fallo === null) {
      ejecucion.completar(acumulado.resultado(), ahora);
    } else {
      const seguro = errorSeguro(fallo);
      this.logger.error(
        `[TAREA] Falló clave=${ejecucion.clave} intento=${ejecucion.intentos} codigo=${seguro.codigo}`,
        fallo instanceof Error ? fallo.stack : undefined,
      );
      ejecucion.fallar(seguro, acumulado.resultado(), ahora);
    }

    if (!(await this.ejecuciones.finalizar(ejecucion))) {
      this.logger.warn(
        `[TAREA] Otra ejecución retomó la tarea; este resultado no se guardó clave=${ejecucion.clave}`,
      );
    }

    return {
      resultado: 'EJECUTADA',
      ejecucionId: ejecucion.id!,
      estado: ejecucion.estado,
      errorCodigo: ejecucion.errorCodigo,
    };
  }
}

function omitida(
  motivo: MotivoOmisionTarea,
  ejecucionId: number | null,
): Extract<ResultadoTareaProgramada, { resultado: 'OMITIDA' }> {
  return { resultado: 'OMITIDA', motivo, ejecucionId };
}

/** El mensaje de un DomainError está escrito para mostrarse; el resto no. */
function errorSeguro(error: unknown): { codigo: string; mensaje: string } {
  if (esDomainError(error)) {
    return { codigo: error.codigo, mensaje: error.message };
  }
  return {
    codigo: 'ERROR_INTERNO',
    mensaje: 'La tarea falló por un error inesperado.',
  };
}

function nombreDe(error: unknown): string {
  return error instanceof Error ? error.name : 'desconocido';
}

const LONGITUD_REFERENCIA = 100;

/** Conteos y errores que el trabajo va informando. */
class AcumuladorTarea {
  private procesados = 0;
  private errores = 0;
  private readonly detalle: ErrorElementoTarea[] = [];
  private omitidos = 0;
  private readonly datos: Record<string, ValorResumen> = {};

  contar(cantidad: number): void {
    if (Number.isFinite(cantidad) && cantidad > 0) {
      this.procesados += Math.trunc(cantidad);
    }
  }

  registrarError(referencia: string, codigo: string): void {
    this.errores += 1;
    if (this.detalle.length >= MAXIMO_ERRORES_DETALLE) {
      this.omitidos += 1;
      return;
    }
    this.detalle.push({
      referencia: String(referencia).slice(0, LONGITUD_REFERENCIA),
      codigo: String(codigo).slice(0, LONGITUD_REFERENCIA),
    });
  }

  anotar(nombre: string, valor: ValorResumen): void {
    this.datos[String(nombre).slice(0, LONGITUD_REFERENCIA)] =
      typeof valor === 'string' ? valor.slice(0, LONGITUD_REFERENCIA) : valor;
  }

  resultado(): ResultadoParcialTarea {
    const vacio = this.errores === 0 && Object.keys(this.datos).length === 0;
    return {
      procesados: this.procesados,
      errores: this.errores,
      resumen: vacio
        ? null
        : {
            datos: { ...this.datos },
            erroresDetalle: [...this.detalle],
            erroresOmitidos: this.omitidos,
          },
    };
  }
}
