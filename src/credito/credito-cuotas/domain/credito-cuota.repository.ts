import { CreateCuotaCustomDto } from 'src/credito/credito-cuotas/dto/create-cuota-custom.dto';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';

export const CUOTA_CREADITO = Symbol('CUOTA_CREADITO');

export interface CuotaCreditoRepository {
  create(dto: CuotaCredito): Promise<Array<CuotaCredito>>;
  createCuotaCreditoCustom(
    dto: CreateCuotaCustomDto,
    creditoId: number,
  ): Promise<Array<CuotaCredito>>;
  saveMany(cuotas: CuotaCredito[]): Promise<void>;
}
