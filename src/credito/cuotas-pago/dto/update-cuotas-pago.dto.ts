import { PartialType } from '@nestjs/mapped-types';
import { CreateCuotasPagoDto } from './create-cuotas-pago.dto';

export class UpdateCuotasPagoDto extends PartialType(CreateCuotasPagoDto) {}
