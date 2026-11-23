import { PartialType } from '@nestjs/swagger';
import { CreateFacturaEliminacionDto } from './create-factura-eliminacion.dto';

export class UpdateFacturaEliminacionDto extends PartialType(CreateFacturaEliminacionDto) {}
