import { PartialType } from '@nestjs/swagger';
import { CreateZonaFacturacionCronDto } from './create-zona-facturacion-cron.dto';

export class UpdateZonaFacturacionCronDto extends PartialType(CreateZonaFacturacionCronDto) {}
