import { PartialType } from '@nestjs/swagger';
import { CreateTwilioApiDto } from './create-twilio-api.dto';

export class UpdateTwilioApiDto extends PartialType(CreateTwilioApiDto) {}
