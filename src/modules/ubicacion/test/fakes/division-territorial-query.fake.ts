import { DivisionTerritorialQueryPort } from '../../domain/ports/division-territorial-query.port';
import {
  DepartamentoReadModel,
  MunicipioReadModel,
} from '../../domain/read-models/division-territorial.read-model';

/** Departamentos 1 y 2; municipios 10 y 11 en el 1, y 20 en el 2. */
export class DivisionTerritorialQueryFake
  implements DivisionTerritorialQueryPort
{
  readonly departamentos: DepartamentoReadModel[] = [
    { id: 1, nombre: 'Huehuetenango' },
    { id: 2, nombre: 'Petén' },
  ];
  readonly municipios: MunicipioReadModel[] = [
    { id: 10, nombre: 'Jacaltenango', departamentoId: 1 },
    { id: 11, nombre: 'La Democracia', departamentoId: 1 },
    { id: 20, nombre: 'La Libertad', departamentoId: 2 },
  ];

  findDepartamentos(): Promise<DepartamentoReadModel[]> {
    return Promise.resolve([...this.departamentos]);
  }

  findMunicipios(departamentoId?: number): Promise<MunicipioReadModel[]> {
    return Promise.resolve(
      this.municipios.filter(
        (m) =>
          departamentoId === undefined || m.departamentoId === departamentoId,
      ),
    );
  }

  findDepartamento(id: number): Promise<DepartamentoReadModel | null> {
    return Promise.resolve(this.departamentos.find((d) => d.id === id) ?? null);
  }

  findMunicipio(id: number): Promise<MunicipioReadModel | null> {
    return Promise.resolve(this.municipios.find((m) => m.id === id) ?? null);
  }
}
