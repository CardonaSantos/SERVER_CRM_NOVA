import { PartialType } from '@nestjs/swagger';
import { CreateCreditoCuotaDto } from './create-credito-cuota.dto';

export class UpdateCreditoCuotaDto extends PartialType(CreateCreditoCuotaDto) {}
