import { Inject, Injectable } from '@nestjs/common';
import { FacturaNoEncontradaError } from '../../domain/errors/facturacion.errors';
import {
  FACTURA_QUERY,
  FacturaQueryPort,
} from '../../domain/ports/factura-query.port';
import { FacturaImpresion } from '../../domain/read-models/factura.read-model';

@Injectable()
export class ObtenerFacturaImpresionUseCase {
  constructor(
    @Inject(FACTURA_QUERY) private readonly consulta: FacturaQueryPort,
  ) {}

  async execute(facturaId: number): Promise<FacturaImpresion> {
    const factura = await this.consulta.findImpresion(facturaId);
    if (!factura) throw new FacturaNoEncontradaError();

    return factura;
  }
}
