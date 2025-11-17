import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificacioneDto } from './create-notificacione.dto';

export class UpdateNotificacioneDto extends PartialType(CreateNotificacioneDto) {}
