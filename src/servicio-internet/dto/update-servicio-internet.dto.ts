import { PartialType } from '@nestjs/mapped-types';
import { CreateServicioInternetDto } from './create-servicio-internet.dto';

export class UpdateServicioInternetDto extends PartialType(CreateServicioInternetDto) {}
