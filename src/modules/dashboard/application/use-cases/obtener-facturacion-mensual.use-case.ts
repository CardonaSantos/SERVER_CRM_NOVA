import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  facturacionMensual,
  ultimosMeses,
} from '../../domain/policies/facturacion-mensual.policy';
import {
  FINANZAS_QUERY,
  FinanzasQueryPort,
} from '../../domain/ports/finanzas-query.port';
import { FacturacionMensualReadModel } from '../../domain/read-models/finanzas.read-model';

const MESES_POR_DEFECTO = 12;

@Injectable()
export class ObtenerFacturacionMensualUseCase {
  constructor(
    @Inject(FINANZAS_QUERY) private readonly finanzas: FinanzasQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: {
    meses?: number;
  }): Promise<FacturacionMensualReadModel> {
    const hoy = this.reloj.fechaOperativa();
    const meses = ultimosMeses(hoy, input.meses ?? MESES_POR_DEFECTO);

    const [facturas, pagos] = await Promise.all([
      this.finanzas.findFacturasDeMeses(meses),
      this.finanzas.findPagosDeMeses(meses),
    ]);

    return facturacionMensual(hoy, meses, facturas, pagos);
  }
}
