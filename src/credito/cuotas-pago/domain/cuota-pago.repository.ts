import { Credito } from 'src/credito/entities/credito.entity';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';
import Decimal from 'decimal.js';

export const CUOTA_PAGO = Symbol('CUOTA_PAGO');
export interface CuotaPagoRepository {
  persistirPago(params: {
    credito: Credito;
    cuota: CuotaCredito;
    monto: Decimal;
    dto: CreateCuotasPagoDto;
  }): Promise<void>;

  findByIdWithCuotas(id: number): Promise<Credito>;
  findByPagoCuotaId(pagoCuotaId: number): Promise<Credito>;

  persistirEliminacionPago(params: {
    credito: Credito;
    cuota: CuotaCredito;
    pagoCuotaId: number;
  }): Promise<void>;
}
