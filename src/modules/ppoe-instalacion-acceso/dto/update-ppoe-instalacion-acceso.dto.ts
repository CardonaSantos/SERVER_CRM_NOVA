import { PartialType } from '@nestjs/swagger';
import { CreatePpoeInstalacionAccesoDto } from './create-ppoe-instalacion-acceso.dto';

export class UpdatePpoeInstalacionAccesoDto extends PartialType(CreatePpoeInstalacionAccesoDto) {}
