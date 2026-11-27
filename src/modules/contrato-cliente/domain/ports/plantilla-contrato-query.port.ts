import { ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  PlantillaContratoFiltros,
  PlantillaContratoListItem,
} from '../read-models/plantilla-contrato-listado.read-model';

export const PLANTILLA_CONTRATO_QUERY = Symbol('PLANTILLA_CONTRATO_QUERY');

export interface PlantillaContratoQueryPort {
  findMany(
    filtros: PlantillaContratoFiltros,
  ): Promise<ResultadoPaginado<PlantillaContratoListItem>>;
}
