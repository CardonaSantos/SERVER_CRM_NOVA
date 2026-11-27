import {
  DepartamentoReadModel,
  MunicipioReadModel,
} from '../read-models/division-territorial.read-model';

export const DIVISION_TERRITORIAL_QUERY = Symbol('DIVISION_TERRITORIAL_QUERY');

/** Departamentos y municipios: un catálogo que la aplicación no modifica. */
export interface DivisionTerritorialQueryPort {
  /** Por nombre. */
  findDepartamentos(): Promise<DepartamentoReadModel[]>;

  /** Por nombre; sin departamento, todos. */
  findMunicipios(departamentoId?: number): Promise<MunicipioReadModel[]>;

  findDepartamento(id: number): Promise<DepartamentoReadModel | null>;

  findMunicipio(id: number): Promise<MunicipioReadModel | null>;
}
