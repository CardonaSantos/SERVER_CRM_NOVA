import { UltimaUbicacionReadModel } from '../read-models/ultima-ubicacion.read-model';

export const ULTIMA_UBICACION_QUERY = Symbol('ULTIMA_UBICACION_QUERY');

export interface UltimaUbicacionQueryPort {
  /** Posición actual de quienes reportaron desde `desde`, la más reciente primero. */
  findActualizadasDesde(desde: Date): Promise<UltimaUbicacionReadModel[]>;

  /** Posición actual de un usuario; `null` si nunca reportó. */
  findByUsuario(usuarioId: number): Promise<UltimaUbicacionReadModel | null>;
}
