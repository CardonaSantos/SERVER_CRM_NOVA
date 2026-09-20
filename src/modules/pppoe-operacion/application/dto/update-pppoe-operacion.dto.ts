import { PartialType } from '@nestjs/mapped-types';
import { CreatePppoeOperacionDto } from './create-pppoe-operacion.dto';

export class UpdatePppoeOperacionDto extends PartialType(CreatePppoeOperacionDto) {}
