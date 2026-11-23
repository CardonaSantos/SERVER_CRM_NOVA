import { PartialType } from '@nestjs/swagger';
import { CreateServicioInternetDto } from './create-servicio-internet.dto';

export class UpdateServicioInternetDto extends PartialType(
  CreateServicioInternetDto,
) {}
