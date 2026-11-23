import { PartialType } from '@nestjs/swagger';
import { CreateTwilioDto } from './create-twilio.dto';

export class UpdateTwilioDto extends PartialType(CreateTwilioDto) {}
