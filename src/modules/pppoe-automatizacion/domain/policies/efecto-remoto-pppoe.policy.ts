import {
  PppoeOperacionPasoReadModel,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

/** Pasos que cambian RouterOS. Alineado con FinalizarPppoeOperacionUseCase. */
const PASOS_CON_EFECTO_REMOTO = new Set<TipoPasoPppoe>([
  TipoPasoPppoe.AGREGAR_SECRET,
  TipoPasoPppoe.HABILITAR_SECRET,
  TipoPasoPppoe.DESHABILITAR_SECRET,
  TipoPasoPppoe.REMOVER_SESION_ACTIVA,
  TipoPasoPppoe.ELIMINAR_SECRET,
]);

/**
 * Hay evidencia de que el router pudo cambiar: un paso con efecto remoto que
 * terminó (bien o mal). Es lo que separa una operación PARCIAL de una FALLIDA.
 */
export function huboPosibleEfectoRemoto(
  pasos: readonly PppoeOperacionPasoReadModel[],
): boolean {
  return pasos.some(
    (paso) =>
      PASOS_CON_EFECTO_REMOTO.has(paso.tipo) &&
      (paso.fueExitoso || paso.fueFallido),
  );
}
