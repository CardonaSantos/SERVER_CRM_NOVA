import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditoCuotaDto } from './create-credito-cuota.dto';

export class UpdateCreditoCuotaDto extends PartialType(CreateCreditoCuotaDto) {}
