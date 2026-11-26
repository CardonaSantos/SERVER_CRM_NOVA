import { TecnicoDesinstalacionConflictoError } from '../errors/cliente-desinstalacion.errors';

/** Una desinstalación tiene a lo sumo un técnico responsable. */
export function exigirUnSoloResponsable(
  tecnicos: readonly { esResponsable?: boolean | null }[],
): void {
  if (tecnicos.filter((tecnico) => tecnico.esResponsable).length > 1) {
    throw new TecnicoDesinstalacionConflictoError(
      'Solo puede haber un técnico responsable por desinstalación.',
    );
  }
}

/** Al asignar un técnico responsable no debe haber otro ya. */
export function exigirSinResponsableActual(
  actuales: readonly { esResponsable: boolean }[],
): void {
  if (actuales.some((tecnico) => tecnico.esResponsable)) {
    throw new TecnicoDesinstalacionConflictoError(
      'La desinstalación ya tiene un técnico responsable.',
    );
  }
}
