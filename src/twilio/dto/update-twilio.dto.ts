import { PartialType } from '@nestjs/mapped-types';
import { CreateTwilioDto } from './create-twilio.dto';

export class UpdateTwilioDto extends PartialType(CreateTwilioDto) {}
