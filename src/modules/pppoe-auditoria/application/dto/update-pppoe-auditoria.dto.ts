import { PartialType } from '@nestjs/mapped-types';
import { CreatePppoeAuditoriaDto } from './create-pppoe-auditoria.dto';

export class UpdatePppoeAuditoriaDto extends PartialType(CreatePppoeAuditoriaDto) {}
