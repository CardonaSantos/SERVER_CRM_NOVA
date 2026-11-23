import { PartialType } from '@nestjs/swagger';
import { CreatePppoeOperacionDto } from './create-pppoe-operacion.dto';

export class UpdatePppoeOperacionDto extends PartialType(CreatePppoeOperacionDto) {}
