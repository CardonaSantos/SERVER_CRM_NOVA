import { UbicacionAsignada } from '../../public/ubicacion.types';

export type ComprobacionesUbicacion = {
  departamento: boolean;
  municipio: boolean;
  sector: boolean;
};

/**
 * Qué hay que comprobar de una asignación: solo lo que cambia. Una combinación
 * antigua que no cuadra se conserva mientras no se toque.
 */
export function comprobacionesDe(
  nueva: UbicacionAsignada,
  anterior?: UbicacionAsignada,
): ComprobacionesUbicacion {
  const cambia = (campo: keyof UbicacionAsignada) =>
    nueva[campo] !== (anterior?.[campo] ?? null);

  return {
    departamento: nueva.departamentoId !== null && cambia('departamentoId'),
    municipio:
      nueva.municipioId !== null &&
      (cambia('municipioId') || cambia('departamentoId')),
    sector:
      nueva.sectorId !== null && (cambia('sectorId') || cambia('municipioId')),
  };
}
