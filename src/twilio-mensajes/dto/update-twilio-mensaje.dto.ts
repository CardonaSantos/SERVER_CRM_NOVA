import { PartialType } from '@nestjs/mapped-types';
import { CreateTwilioMensajeDto } from './create-twilio-mensaje.dto';

export class UpdateTwilioMensajeDto extends PartialType(CreateTwilioMensajeDto) {}
