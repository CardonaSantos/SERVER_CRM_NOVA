import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { deudaPorAntiguedad } from '../../domain/policies/deuda.policy';
import {
  FINANZAS_QUERY,
  FinanzasQueryPort,
} from '../../domain/ports/finanzas-query.port';
import { DeudaAntiguedadReadModel } from '../../domain/read-models/finanzas.read-model';

@Injectable()
export class ObtenerDeudaAntiguedadUseCase {
  constructor(
    @Inject(FINANZAS_QUERY) private readonly finanzas: FinanzasQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<DeudaAntiguedadReadModel> {
    return deudaPorAntiguedad(
      await this.finanzas.findFacturasSinPagar(),
      this.reloj.fechaOperativa(),
    );
  }
}
