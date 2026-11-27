import { Inject, Injectable } from '@nestjs/common';
import {
  DIVISION_TERRITORIAL_QUERY,
  DivisionTerritorialQueryPort,
} from '../../domain/ports/division-territorial-query.port';
import { DepartamentoReadModel } from '../../domain/read-models/division-territorial.read-model';

@Injectable()
export class ListarDepartamentosUseCase {
  constructor(
    @Inject(DIVISION_TERRITORIAL_QUERY)
    private readonly division: DivisionTerritorialQueryPort,
  ) {}

  execute(): Promise<DepartamentoReadModel[]> {
    return this.division.findDepartamentos();
  }
}
