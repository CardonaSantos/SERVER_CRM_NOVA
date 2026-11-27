import { Injectable } from '@nestjs/common';
import { mesesEntre } from '../../domain/policies/calendario-factura.policy';
import { FacturaProps } from '../../domain/props/factura.props';
import { EmisorFacturasService } from '../services/emisor-facturas.service';

export type GenerarFacturaInput = {
  usuarioId: number;
  clienteId: number;
  anio: number;
  mes: number;
};

@Injectable()
export class GenerarFacturaUseCase {
  constructor(private readonly emisor: EmisorFacturasService) {}

  async execute(input: GenerarFacturaInput): Promise<FacturaProps> {
    const [factura] = await this.emisor.emitir({
      clienteId: input.clienteId,
      creadorId: input.usuarioId,
      meses: mesesEntre(input.anio, input.mes, input.mes),
    });

    return factura;
  }
}
