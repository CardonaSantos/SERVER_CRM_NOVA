import { Injectable } from '@nestjs/common';
import { mesesEntre } from '../../domain/policies/calendario-factura.policy';
import { FacturaProps } from '../../domain/props/factura.props';
import { EmisorFacturasService } from '../services/emisor-facturas.service';

export type GenerarFacturasInput = {
  usuarioId: number;
  clienteId: number;
  anio: number;
  mesInicio: number;
  mesFin: number;
};

/** Facturas de varios meses seguidos: todas o ninguna. */
@Injectable()
export class GenerarFacturasUseCase {
  constructor(private readonly emisor: EmisorFacturasService) {}

  execute(input: GenerarFacturasInput): Promise<FacturaProps[]> {
    return this.emisor.emitir({
      clienteId: input.clienteId,
      creadorId: input.usuarioId,
      meses: mesesEntre(input.anio, input.mesInicio, input.mesFin),
    });
  }
}
