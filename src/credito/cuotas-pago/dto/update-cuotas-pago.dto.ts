import { PartialType } from '@nestjs/swagger';
import { CreateCuotasPagoDto } from './create-cuotas-pago.dto';

export class UpdateCuotasPagoDto extends PartialType(CreateCuotasPagoDto) {}
