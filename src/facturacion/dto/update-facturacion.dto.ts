import { PartialType } from '@nestjs/swagger';
import { CreateFacturacionDto } from './create-facturacion.dto';

export class UpdateFacturacionDto extends PartialType(CreateFacturacionDto) {}
