import { Inject, Injectable } from '@nestjs/common';
import {
  DIVISION_TERRITORIAL_QUERY,
  DivisionTerritorialQueryPort,
} from '../../domain/ports/division-territorial-query.port';
import { MunicipioReadModel } from '../../domain/read-models/division-territorial.read-model';

@Injectable()
export class ListarMunicipiosUseCase {
  constructor(
    @Inject(DIVISION_TERRITORIAL_QUERY)
    private readonly division: DivisionTerritorialQueryPort,
  ) {}

  execute(departamentoId?: number): Promise<MunicipioReadModel[]> {
    return this.division.findMunicipios(departamentoId);
  }
}
