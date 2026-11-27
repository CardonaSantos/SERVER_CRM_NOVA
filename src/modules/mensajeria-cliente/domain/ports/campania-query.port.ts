import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  CampaniaReadModel,
  EnvioFiltros,
  EnvioListItem,
} from '../read-models/campania.read-model';

export const CAMPANIA_QUERY = Symbol('CAMPANIA_QUERY');

export interface CampaniaQueryPort {
  /** De la más reciente a la más antigua, con sus totales. */
  findMany(
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<CampaniaReadModel>>;

  findDetail(id: number): Promise<CampaniaReadModel | null>;

  /** Destinos de una campaña, en el orden en que se envían. */
  findEnvios(
    campaniaId: number,
    filtros: EnvioFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<EnvioListItem>>;
}
