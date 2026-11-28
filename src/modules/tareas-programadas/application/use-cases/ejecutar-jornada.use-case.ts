import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import { MomentoJornada } from '../../domain/enums/jornada.enum';
import { errorSeguro } from '../../domain/policies/error-seguro.policy';
import { claveJornada } from '../../domain/policies/jornada.policy';
import { dentroDeVentanaClientes } from '../../domain/policies/ventana-clientes.policy';
import {
  ContextoEtapaJornada,
  ContextoTareaProgramada,
  ResultadoTareaProgramada,
} from '../../public/tareas-programadas.facade.port';
import { RegistroEtapasJornadaService } from '../services/registro-etapas-jornada.service';
import { EjecutarTareaProgramadaUseCase } from './ejecutar-tarea-programada.use-case';

export type EjecutarJornadaInput = { momento: MomentoJornada };

export type EjecutarJornadaResult = {
  /** Lo que pasó con la ejecución `JORNADA:<fecha>`. */
  jornada: ResultadoTareaProgramada;
  /** El repaso recorrió las etapas porque la jornada ya había terminado. */
  repasoEjecutado: boolean;
};

const TAREA_JORNADA = 'JORNADA';

type Informe = Pick<
  ContextoTareaProgramada,
  'contarProcesados' | 'registrarError' | 'anotar' | 'sigueVigente'
>;

type Totales = {
  pasosCompletados: number;
  pasosConErrores: number;
  pasosFallidos: number;
  pasosOmitidos: number;
  etapasFallidas: number;
};

/**
 * La jornada diaria y su repaso (guía de cobranza §4.2 y §4.3).
 *
 * - Jornada (10:00): toma `JORNADA:<fecha>` y recorre las etapas en orden.
 * - Repaso: si la jornada no terminó (proceso caído, reinicio), la retoma; si
 *   ya terminó, vuelve a recorrer las etapas para que cada una retome sus
 *   pasos fallidos. Si la jornada está en curso, no hace nada.
 *
 * Nada empieza fuera de la ventana de 10:00 a 18:00.
 */
@Injectable()
export class EjecutarJornadaUseCase {
  private readonly logger = new Logger(EjecutarJornadaUseCase.name);

  constructor(
    private readonly tareas: EjecutarTareaProgramadaUseCase,
    private readonly registro: RegistroEtapasJornadaService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EjecutarJornadaInput): Promise<EjecutarJornadaResult> {
    if (!this.dentroDeVentana()) {
      return {
        jornada: {
          resultado: 'OMITIDA',
          motivo: 'FUERA_DE_VENTANA',
          ejecucionId: null,
        },
        repasoEjecutado: false,
      };
    }

    const fechaOperativa = this.reloj.fechaOperativa();
    const jornada = await this.tareas.execute({
      clave: claveJornada(fechaOperativa),
      tarea: TAREA_JORNADA,
      fechaOperativa,
      trabajo: (contexto) =>
        this.recorrer(input.momento, fechaOperativa, contexto),
    });

    const terminada =
      jornada.resultado === 'OMITIDA' &&
      (jornada.motivo === 'COMPLETADA' || jornada.motivo === 'AGOTADA');
    if (input.momento !== MomentoJornada.REPASO || !terminada) {
      return { jornada, repasoEjecutado: false };
    }

    await this.recorrer(
      MomentoJornada.REPASO,
      fechaOperativa,
      this.informeDeRepaso(),
    );
    return { jornada, repasoEjecutado: true };
  }

  private async recorrer(
    momento: MomentoJornada,
    fechaOperativa: string,
    informe: Informe,
  ): Promise<void> {
    const totales: Totales = {
      pasosCompletados: 0,
      pasosConErrores: 0,
      pasosFallidos: 0,
      pasosOmitidos: 0,
      etapasFallidas: 0,
    };
    let cortadaPorVentana = false;

    for (const etapa of this.registro.enOrden()) {
      if (!informe.sigueVigente()) {
        this.logger.warn(
          `[JORNADA] Se detuvo: otra ejecución la retomó fecha=${fechaOperativa}`,
        );
        break;
      }
      if (!this.dentroDeVentana()) {
        cortadaPorVentana = true;
        break;
      }

      const contexto: ContextoEtapaJornada = {
        fechaOperativa,
        momento,
        dentroDeVentana: () => this.dentroDeVentana(),
        ejecutarPaso: async (paso) => {
          if (!this.dentroDeVentana()) {
            totales.pasosOmitidos += 1;
            return {
              resultado: 'OMITIDA',
              motivo: 'FUERA_DE_VENTANA',
              ejecucionId: null,
            };
          }
          const resultado = await this.tareas.execute({
            ...paso,
            fechaOperativa,
            origen: OrigenEjecucionTarea.PROGRAMADA,
            ejecutadaPorId: null,
          });
          contarPaso(resultado, paso.clave, totales, informe);
          return resultado;
        },
      };

      try {
        await etapa.ejecutar(contexto);
        informe.contarProcesados();
      } catch (error) {
        totales.etapasFallidas += 1;
        const seguro = errorSeguro(error);
        informe.registrarError(`etapa-${etapa.tarea}`, seguro.codigo);
        this.logger.error(
          `[JORNADA] Falló la etapa ${etapa.tarea} fecha=${fechaOperativa} codigo=${seguro.codigo}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    for (const [nombre, valor] of Object.entries(totales)) {
      informe.anotar(nombre, valor);
    }
    if (cortadaPorVentana) informe.anotar('cortadaPorVentana', true);

    this.logger.log(
      `[JORNADA] ${momento} fecha=${fechaOperativa} ` +
        `completados=${totales.pasosCompletados} conErrores=${totales.pasosConErrores} ` +
        `fallidos=${totales.pasosFallidos} omitidos=${totales.pasosOmitidos} ` +
        `etapasFallidas=${totales.etapasFallidas}` +
        (cortadaPorVentana ? ' cortadaPorVentana' : ''),
    );
  }

  /** El repaso de una jornada terminada no tiene fila propia: solo registra en el log. */
  private informeDeRepaso(): Informe {
    return {
      contarProcesados: () => {},
      anotar: () => {},
      registrarError: (referencia, codigo) =>
        this.logger.warn(
          `[JORNADA] Repaso con error referencia=${referencia} codigo=${codigo}`,
        ),
      sigueVigente: () => true,
    };
  }

  private dentroDeVentana(): boolean {
    return dentroDeVentanaClientes(this.reloj.ahora());
  }
}

function contarPaso(
  resultado: ResultadoTareaProgramada,
  clave: string,
  totales: Totales,
  informe: Informe,
): void {
  if (resultado.resultado === 'OMITIDA') {
    totales.pasosOmitidos += 1;
    return;
  }
  switch (resultado.estado) {
    case EstadoEjecucionTarea.FALLIDA:
      totales.pasosFallidos += 1;
      informe.registrarError(clave, resultado.errorCodigo ?? 'FALLIDA');
      return;
    case EstadoEjecucionTarea.COMPLETADA_CON_ERRORES:
      totales.pasosConErrores += 1;
      return;
    default:
      totales.pasosCompletados += 1;
  }
}
