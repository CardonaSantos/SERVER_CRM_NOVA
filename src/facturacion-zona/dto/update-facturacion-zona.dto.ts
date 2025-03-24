import { PartialType } from '@nestjs/mapped-types';
import { CreateFacturacionZonaDto } from './create-facturacion-zona.dto';

export class UpdateFacturacionZonaDto extends PartialType(CreateFacturacionZonaDto) {}
