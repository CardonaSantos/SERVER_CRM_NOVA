import { RangoFechas } from '../policies/calendario.policy';
import { TrabajosDeCampoFinalizados } from '../read-models/instalaciones.read-model';

export const INSTALACIONES_QUERY = Symbol('INSTALACIONES_QUERY');

export interface InstalacionesQueryPort {
  /** Instalaciones y desinstalaciones completadas dentro del rango. */
  findFinalizadas(rango: RangoFechas): Promise<TrabajosDeCampoFinalizados>;
}
