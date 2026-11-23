import { PartialType } from '@nestjs/swagger';
import { CreatePppoeAuditoriaDto } from './create-pppoe-auditoria.dto';

export class UpdatePppoeAuditoriaDto extends PartialType(CreatePppoeAuditoriaDto) {}
