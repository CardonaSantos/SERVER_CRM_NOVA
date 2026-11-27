import { Inject, Injectable } from '@nestjs/common';
import { FacturaNoEncontradaError } from '../../domain/errors/facturacion.errors';
import {
  FACTURA_QUERY,
  FacturaQueryPort,
} from '../../domain/ports/factura-query.port';
import { FacturaDetalle } from '../../domain/read-models/factura.read-model';

@Injectable()
export class ObtenerFacturaDetalleUseCase {
  constructor(
    @Inject(FACTURA_QUERY) private readonly consulta: FacturaQueryPort,
  ) {}

  async execute(facturaId: number): Promise<FacturaDetalle> {
    const factura = await this.consulta.findDetalle(facturaId);
    if (!factura) throw new FacturaNoEncontradaError();

    return factura;
  }
}
