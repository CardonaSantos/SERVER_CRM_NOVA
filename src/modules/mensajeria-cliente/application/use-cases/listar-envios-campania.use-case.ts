import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { CampaniaNoEncontradaError } from '../../domain/errors/mensajeria-cliente.errors';
import {
  CAMPANIA_QUERY,
  CampaniaQueryPort,
} from '../../domain/ports/campania-query.port';
import {
  EnvioFiltros,
  EnvioListItem,
} from '../../domain/read-models/campania.read-model';

export type ListarEnviosCampaniaInput = EnvioFiltros & {
  campaniaId: number;
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarEnviosCampaniaUseCase {
  constructor(
    @Inject(CAMPANIA_QUERY) private readonly consulta: CampaniaQueryPort,
  ) {}

  async execute(
    input: ListarEnviosCampaniaInput,
  ): Promise<ResultadoPaginado<EnvioListItem>> {
    if (!(await this.consulta.findDetail(input.campaniaId))) {
      throw new CampaniaNoEncontradaError();
    }
    return this.consulta.findEnvios(
      input.campaniaId,
      { estado: input.estado },
      normalizarPaginacion(input),
    );
  }
}
