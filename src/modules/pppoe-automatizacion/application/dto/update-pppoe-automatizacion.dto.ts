import { PartialType } from '@nestjs/mapped-types';
import { CreatePppoeAutomatizacionDto } from './create-pppoe-automatizacion.dto';

export class UpdatePppoeAutomatizacionDto extends PartialType(CreatePppoeAutomatizacionDto) {}
