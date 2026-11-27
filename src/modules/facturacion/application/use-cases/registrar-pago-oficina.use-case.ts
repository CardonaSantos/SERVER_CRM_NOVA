import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';
import { OrigenPago } from '../../domain/enums/origen-pago.enum';
import {
  PagoRegistrado,
  RegistradorPagosService,
} from '../services/registrador-pagos.service';

export type RegistrarPagoOficinaInput = {
  /** Quien cobra: el usuario de la sesión. */
  usuarioId: number;
  facturaId: number;
  clienteId: number;
  montoPagado: number;
  metodoPago: MetodoPago;
  numeroBoleta?: string | null;
  /** Si no llega, es ahora. */
  fechaPago?: Date | null;
};

@Injectable()
export class RegistrarPagoOficinaUseCase {
  constructor(
    private readonly registrador: RegistradorPagosService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: RegistrarPagoOficinaInput): Promise<PagoRegistrado> {
    const { usuarioId, fechaPago, ...pago } = input;

    return this.registrador.registrar({
      ...pago,
      cobradorId: usuarioId,
      fechaPago: fechaPago ?? this.reloj.ahora(),
      origen: OrigenPago.OFICINA,
    });
  }
}
