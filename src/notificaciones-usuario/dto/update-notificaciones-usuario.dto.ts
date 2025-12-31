import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificacionUsuarioDto } from './create-notificaciones-usuario.dto';

export class UpdateNotificacionesUsuarioDto extends PartialType(
  CreateNotificacionUsuarioDto,
) {}
