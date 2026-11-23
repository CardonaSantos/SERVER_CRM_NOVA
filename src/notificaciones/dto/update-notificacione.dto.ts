import { PartialType } from '@nestjs/swagger';
import { CreateNotificacionDto } from './create-notificacione.dto';

export class UpdateNotificacioneDto extends PartialType(
  CreateNotificacionDto,
) {}
