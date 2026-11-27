import { Inject, Injectable } from '@nestjs/common';
import {
  RUTA_COBRO_QUERY,
  RutaCobroQueryPort,
} from '../../domain/ports/ruta-cobro-query.port';
import { RutaCobroResumen } from '../../domain/read-models/ruta-cobro.read-model';

export type ListarRutasAsignadasResult = {
  rutas: RutaCobroResumen[];
  totales: { rutas: number; clientes: number };
};

/** Las rutas abiertas de quien pregunta. */
@Injectable()
export class ListarRutasAsignadasUseCase {
  constructor(
    @Inject(RUTA_COBRO_QUERY) private readonly consulta: RutaCobroQueryPort,
  ) {}

  async execute(input: {
    usuarioId: number;
  }): Promise<ListarRutasAsignadasResult> {
    const rutas = await this.consulta.findAsignadas(input.usuarioId);

    return {
      rutas,
      totales: {
        rutas: rutas.length,
        clientes: rutas.reduce((n, ruta) => n + ruta.totales.clientes, 0),
      },
    };
  }
}
