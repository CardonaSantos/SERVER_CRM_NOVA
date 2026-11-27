import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { CampaniaNoEncontradaError } from '../../domain/errors/mensajeria-cliente.errors';
import { estadoVigente } from '../../domain/policies/campania.policy';
import {
  CAMPANIA_QUERY,
  CampaniaQueryPort,
} from '../../domain/ports/campania-query.port';
import { CampaniaReadModel } from '../../domain/read-models/campania.read-model';

/** Avance de una campaña. */
@Injectable()
export class ObtenerCampaniaUseCase {
  constructor(
    @Inject(CAMPANIA_QUERY) private readonly consulta: CampaniaQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { campaniaId: number }): Promise<CampaniaReadModel> {
    const campania = await this.consulta.findDetail(input.campaniaId);
    if (!campania) throw new CampaniaNoEncontradaError();

    return {
      ...campania,
      estado: estadoVigente(campania, this.reloj.ahora()),
    };
  }
}
