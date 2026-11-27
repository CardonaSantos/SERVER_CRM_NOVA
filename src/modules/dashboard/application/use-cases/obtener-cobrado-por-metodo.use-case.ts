import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  cobradoPorMetodo,
  ultimosMeses,
} from '../../domain/policies/facturacion-mensual.policy';
import {
  FINANZAS_QUERY,
  FinanzasQueryPort,
} from '../../domain/ports/finanzas-query.port';
import { CobradoPorMetodoReadModel } from '../../domain/read-models/finanzas.read-model';

const MESES_POR_DEFECTO = 12;

@Injectable()
export class ObtenerCobradoPorMetodoUseCase {
  constructor(
    @Inject(FINANZAS_QUERY) private readonly finanzas: FinanzasQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { meses?: number }): Promise<CobradoPorMetodoReadModel> {
    const hoy = this.reloj.fechaOperativa();
    const meses = ultimosMeses(hoy, input.meses ?? MESES_POR_DEFECTO);

    return cobradoPorMetodo(
      hoy,
      meses,
      await this.finanzas.findPagosDeMeses(meses),
    );
  }
}
