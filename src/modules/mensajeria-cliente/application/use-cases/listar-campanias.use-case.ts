import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { estadoVigente } from '../../domain/policies/campania.policy';
import {
  CAMPANIA_QUERY,
  CampaniaQueryPort,
} from '../../domain/ports/campania-query.port';
import { CampaniaReadModel } from '../../domain/read-models/campania.read-model';

@Injectable()
export class ListarCampaniasUseCase {
  constructor(
    @Inject(CAMPANIA_QUERY) private readonly consulta: CampaniaQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
  }): Promise<ResultadoPaginado<CampaniaReadModel>> {
    const pagina = await this.consulta.findMany(normalizarPaginacion(input));
    const ahora = this.reloj.ahora();

    return {
      ...pagina,
      items: pagina.items.map((campania) => ({
        ...campania,
        estado: estadoVigente(campania, ahora),
      })),
    };
  }
}
