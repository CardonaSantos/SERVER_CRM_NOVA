import { PartialType } from '@nestjs/swagger';
import { CreatePppoeAutomatizacionDto } from './create-pppoe-automatizacion.dto';

export class UpdatePppoeAutomatizacionDto extends PartialType(CreatePppoeAutomatizacionDto) {}
