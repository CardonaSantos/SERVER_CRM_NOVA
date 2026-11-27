import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { AgrupacionUbicacion } from '../../domain/enums/agrupacion-ubicacion.enum';
import { clientesPorUbicacion } from '../../domain/policies/cartera.policy';
import {
  CARTERA_QUERY,
  CarteraQueryPort,
} from '../../domain/ports/cartera-query.port';
import {
  FINANZAS_QUERY,
  FinanzasQueryPort,
} from '../../domain/ports/finanzas-query.port';
import { ClientesPorUbicacionReadModel } from '../../domain/read-models/cartera.read-model';

@Injectable()
export class ObtenerClientesPorUbicacionUseCase {
  constructor(
    @Inject(CARTERA_QUERY) private readonly cartera: CarteraQueryPort,
    @Inject(FINANZAS_QUERY) private readonly finanzas: FinanzasQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: {
    agrupar?: AgrupacionUbicacion;
  }): Promise<ClientesPorUbicacionReadModel> {
    const agrupar = input.agrupar ?? AgrupacionUbicacion.ZONA;

    // La deuda sale de la misma consulta que la antigüedad: así cuadran.
    const [clientes, facturas] = await Promise.all([
      this.cartera.findClientesUbicados(agrupar),
      this.finanzas.findFacturasSinPagar(),
    ]);

    return clientesPorUbicacion(
      agrupar,
      this.reloj.fechaOperativa(),
      clientes,
      facturas,
    );
  }
}
