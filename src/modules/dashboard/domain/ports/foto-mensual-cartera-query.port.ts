import { FotoMensualCarteraReadModel } from '../read-models/evolucion-cartera.read-model';

export const FOTO_MENSUAL_CARTERA_QUERY = Symbol('FOTO_MENSUAL_CARTERA_QUERY');

export interface FotoMensualCarteraQueryPort {
  /** Las fotos guardadas de esos meses (`YYYY-MM`); los que no tienen, no vienen. */
  findDeMeses(meses: readonly string[]): Promise<FotoMensualCarteraReadModel[]>;
}
