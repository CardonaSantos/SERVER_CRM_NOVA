import { PartialType } from '@nestjs/mapped-types';
import { CreateFacturacionDto } from './create-facturacion.dto';

export class UpdateFacturacionDto extends PartialType(CreateFacturacionDto) {}
