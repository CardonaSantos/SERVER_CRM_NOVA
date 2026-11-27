import { Inject, Injectable } from '@nestjs/common';
import { FacturaNoEncontradaError } from '../../domain/errors/facturacion.errors';
import {
  FACTURA_QUERY,
  FacturaQueryPort,
} from '../../domain/ports/factura-query.port';
import { FacturaEdicion } from '../../domain/read-models/factura.read-model';

@Injectable()
export class ObtenerFacturaEdicionUseCase {
  constructor(
    @Inject(FACTURA_QUERY) private readonly consulta: FacturaQueryPort,
  ) {}

  async execute(facturaId: number): Promise<FacturaEdicion> {
    const factura = await this.consulta.findEdicion(facturaId);
    if (!factura) throw new FacturaNoEncontradaError();

    return factura;
  }
}
