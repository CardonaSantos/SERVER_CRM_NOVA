import { PartialType } from '@nestjs/swagger';
import { CreateTwilioMensajeDto } from './create-twilio-mensaje.dto';

export class UpdateTwilioMensajeDto extends PartialType(CreateTwilioMensajeDto) {}
