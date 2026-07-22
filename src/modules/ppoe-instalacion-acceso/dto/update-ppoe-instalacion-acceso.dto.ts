import { PartialType } from '@nestjs/mapped-types';
import { CreatePpoeInstalacionAccesoDto } from './create-ppoe-instalacion-acceso.dto';

export class UpdatePpoeInstalacionAccesoDto extends PartialType(CreatePpoeInstalacionAccesoDto) {}
