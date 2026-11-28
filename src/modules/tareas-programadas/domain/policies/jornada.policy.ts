import { FaseJornada } from '../enums/jornada.enum';
import { EtapaJornadaInvalidaError } from '../errors/tareas-programadas.errors';

const ORDEN_FASES: readonly FaseJornada[] = [
  FaseJornada.FACTURACION,
  FaseJornada.ENVIO_FACTURACION,
  FaseJornada.COBRANZA,
  FaseJornada.ENVIO_COBRANZA,
];

const NOMBRE_TAREA = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export type EtapaOrdenable = {
  tarea: string;
  fase: FaseJornada;
  orden: number;
};

export function claveJornada(fechaOperativa: string): string {
  return `JORNADA:${fechaOperativa}`;
}

/** Por fase y, dentro de la fase, por `orden`; a igual orden, por nombre. */
export function ordenarEtapas<T extends EtapaOrdenable>(
  etapas: readonly T[],
): T[] {
  return [...etapas].sort(
    (a, b) =>
      ORDEN_FASES.indexOf(a.fase) - ORDEN_FASES.indexOf(b.fase) ||
      a.orden - b.orden ||
      a.tarea.localeCompare(b.tarea),
  );
}

/**
 * Una etapa nueva es válida si su nombre es estable, su fase existe y no
 * repite una etapa ya registrada en la misma fase.
 */
export function validarEtapaNueva(
  etapa: EtapaOrdenable,
  existentes: readonly EtapaOrdenable[],
): void {
  if (!NOMBRE_TAREA.test(etapa.tarea)) {
    throw new EtapaJornadaInvalidaError(
      'El nombre de la etapa debe ir en mayúsculas y guiones bajos.',
    );
  }
  if (!ORDEN_FASES.includes(etapa.fase)) {
    throw new EtapaJornadaInvalidaError('La fase de la etapa no existe.');
  }
  if (!Number.isInteger(etapa.orden) || etapa.orden < 0) {
    throw new EtapaJornadaInvalidaError(
      'El orden de la etapa debe ser un entero desde 0.',
    );
  }
  if (
    existentes.some((e) => e.fase === etapa.fase && e.tarea === etapa.tarea)
  ) {
    throw new EtapaJornadaInvalidaError(
      'La etapa ya está registrada en esa fase.',
    );
  }
}
