import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';
import { OrigenPago } from '../../domain/enums/origen-pago.enum';
import {
  PagoRegistrado,
  RegistradorPagosService,
} from '../services/registrador-pagos.service';

export type RegistrarPagoRutaInput = {
  /** Quien cobra: el usuario de la sesión. */
  usuarioId: number;
  rutaId: number;
  facturaId: number;
  clienteId: number;
  montoPagado: number;
  metodoPago: MetodoPago;
  numeroBoleta?: string | null;
};

/** Cobro en calle: la ruta debe estar abierta y tener a ese cliente. */
@Injectable()
export class RegistrarPagoRutaUseCase {
  constructor(
    private readonly registrador: RegistradorPagosService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: RegistrarPagoRutaInput): Promise<PagoRegistrado> {
    const { usuarioId, ...pago } = input;

    return this.registrador.registrar({
      ...pago,
      cobradorId: usuarioId,
      fechaPago: this.reloj.ahora(),
      origen: OrigenPago.RUTA,
    });
  }
}
