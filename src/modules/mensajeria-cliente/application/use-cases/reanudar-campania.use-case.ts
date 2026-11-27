import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { CampaniaNoEncontradaError } from '../../domain/errors/mensajeria-cliente.errors';
import {
  CAMPANIA_REPOSITORY,
  CampaniaRepositoryPort,
} from '../../domain/ports/campania-repository.port';
import { CampaniaReadModel } from '../../domain/read-models/campania.read-model';
import { DespachadorCampaniasService } from '../services/despachador-campanias.service';
import { ObtenerCampaniaUseCase } from './obtener-campania.use-case';

/** Envía lo que quedó pendiente de una campaña interrumpida. */
@Injectable()
export class ReanudarCampaniaUseCase {
  private readonly logger = new Logger(ReanudarCampaniaUseCase.name);

  constructor(
    @Inject(CAMPANIA_REPOSITORY)
    private readonly campanias: CampaniaRepositoryPort,
    private readonly despachador: DespachadorCampaniasService,
    private readonly obtener: ObtenerCampaniaUseCase,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: {
    usuarioId: number;
    campaniaId: number;
  }): Promise<CampaniaReadModel> {
    const campania = await this.campanias.findById(input.campaniaId);
    if (!campania) throw new CampaniaNoEncontradaError();

    const ahora = this.reloj.ahora();
    campania.reanudar(ahora);
    await this.campanias.reanudar(campania, ahora);
    this.logger.log(
      `Campaña ${input.campaniaId} reanudada por el usuario ${input.usuarioId}`,
    );
    this.despachador.despachar(input.campaniaId);

    return this.obtener.execute({ campaniaId: input.campaniaId });
  }
}
