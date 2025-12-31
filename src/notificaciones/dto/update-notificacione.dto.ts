import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificacionDto } from './create-notificacione.dto';

export class UpdateNotificacioneDto extends PartialType(
  CreateNotificacionDto,
) {}
