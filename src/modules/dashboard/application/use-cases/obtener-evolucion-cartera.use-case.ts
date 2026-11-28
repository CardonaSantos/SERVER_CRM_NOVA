import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  evolucionCartera,
  mesesCerrados,
} from '../../domain/policies/foto-mensual.policy';
import {
  FOTO_MENSUAL_CARTERA_QUERY,
  FotoMensualCarteraQueryPort,
} from '../../domain/ports/foto-mensual-cartera-query.port';
import { EvolucionCarteraReadModel } from '../../domain/read-models/evolucion-cartera.read-model';

const MESES_POR_DEFECTO = 12;

/** Clientes y deuda al cierre de cada mes, desde las fotos mensuales. */
@Injectable()
export class ObtenerEvolucionCarteraUseCase {
  constructor(
    @Inject(FOTO_MENSUAL_CARTERA_QUERY)
    private readonly fotos: FotoMensualCarteraQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { meses?: number }): Promise<EvolucionCarteraReadModel> {
    const meses = mesesCerrados(
      this.reloj.fechaOperativa(),
      input.meses ?? MESES_POR_DEFECTO,
    );
    return evolucionCartera(meses, await this.fotos.findDeMeses(meses));
  }
}
