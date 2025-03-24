import { PartialType } from '@nestjs/mapped-types';
import { CreateZonaFacturacionCronDto } from './create-zona-facturacion-cron.dto';

export class UpdateZonaFacturacionCronDto extends PartialType(CreateZonaFacturacionCronDto) {}
