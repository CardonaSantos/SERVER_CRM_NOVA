import { PartialType } from '@nestjs/swagger';
import { CreatePpoeClienteCuentaDto } from './create-ppoe-cliente-cuenta.dto';

export class UpdatePpoeClienteCuentaDto extends PartialType(CreatePpoeClienteCuentaDto) {}
