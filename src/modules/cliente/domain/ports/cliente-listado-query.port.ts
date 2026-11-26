import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  ClienteCampaniaFiltros,
  ClienteCampaniaItem,
  ClienteOpcion,
  ClienteRutaFiltros,
  ClienteRutaItem,
  ClienteTablaFiltros,
  ClienteTablaItem,
  ResumenCartera,
} from '../read-models/cliente-listado.read-model';

export const CLIENTE_LISTADO_QUERY = Symbol('CLIENTE_LISTADO_QUERY');

/** Listas de clientes. Ninguna incluye a los eliminados. */
export interface ClienteListadoQueryPort {
  /** Los más recientes primero. */
  findTabla(
    filtros: ClienteTablaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteTablaItem>>;

  contarCartera(): Promise<ResumenCartera>;

  findParaRuta(
    filtros: ClienteRutaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteRutaItem>>;

  findParaCampania(
    filtros: ClienteCampaniaFiltros,
  ): Promise<ClienteCampaniaItem[]>;

  findOpciones(): Promise<ClienteOpcion[]>;
}
