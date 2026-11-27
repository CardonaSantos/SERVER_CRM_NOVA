import { Inject, Injectable } from '@nestjs/common';
import { RutaCobroNoEncontradaError } from '../../domain/errors/ruta-cobro.errors';
import {
  RUTA_COBRO_QUERY,
  RutaCobroQueryPort,
} from '../../domain/ports/ruta-cobro-query.port';
import { RutaCobroDetalle } from '../../domain/read-models/ruta-cobro.read-model';

/** La ruta con sus clientes y lo que debe cada uno. */
@Injectable()
export class ObtenerRutaCobroUseCase {
  constructor(
    @Inject(RUTA_COBRO_QUERY) private readonly consulta: RutaCobroQueryPort,
  ) {}

  async execute(rutaId: number): Promise<RutaCobroDetalle> {
    const ruta = await this.consulta.findDetalle(rutaId);
    if (!ruta) throw new RutaCobroNoEncontradaError();

    return ruta;
  }
}
