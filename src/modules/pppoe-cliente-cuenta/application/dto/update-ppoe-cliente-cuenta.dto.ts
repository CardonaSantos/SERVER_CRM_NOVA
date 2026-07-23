import { PartialType } from '@nestjs/mapped-types';
import { CreatePpoeClienteCuentaDto } from './create-ppoe-cliente-cuenta.dto';

export class UpdatePpoeClienteCuentaDto extends PartialType(CreatePpoeClienteCuentaDto) {}
