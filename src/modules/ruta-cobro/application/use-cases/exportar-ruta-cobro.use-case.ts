import { Inject, Injectable } from '@nestjs/common';
import { RutaCobroNoEncontradaError } from '../../domain/errors/ruta-cobro.errors';
import {
  RUTA_COBRO_QUERY,
  RutaCobroQueryPort,
} from '../../domain/ports/ruta-cobro-query.port';
import {
  RUTA_COBRO_HOJA,
  RutaCobroHojaPort,
} from '../ports/ruta-cobro-hoja.port';

@Injectable()
export class ExportarRutaCobroUseCase {
  constructor(
    @Inject(RUTA_COBRO_QUERY) private readonly consulta: RutaCobroQueryPort,
    @Inject(RUTA_COBRO_HOJA) private readonly hoja: RutaCobroHojaPort,
  ) {}

  async execute(rutaId: number): Promise<Buffer> {
    const ruta = await this.consulta.findDetalle(rutaId);
    if (!ruta) throw new RutaCobroNoEncontradaError();

    return this.hoja.generar(ruta);
  }
}
