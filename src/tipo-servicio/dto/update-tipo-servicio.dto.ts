import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoServicioDto } from './create-tipo-servicio.dto';

export class UpdateTipoServicioDto extends PartialType(CreateTipoServicioDto) {}
