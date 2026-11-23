import { PartialType } from '@nestjs/swagger';
import { CreateNotificacionUsuarioDto } from './create-notificaciones-usuario.dto';

export class UpdateNotificacionesUsuarioDto extends PartialType(
  CreateNotificacionUsuarioDto,
) {}
