import { PartialType } from '@nestjs/mapped-types';
import { CreateFacturaEliminacionDto } from './create-factura-eliminacion.dto';

export class UpdateFacturaEliminacionDto extends PartialType(CreateFacturaEliminacionDto) {}
