import { PartialType } from '@nestjs/mapped-types';
import { CreateTwilioApiDto } from './create-twilio-api.dto';

export class UpdateTwilioApiDto extends PartialType(CreateTwilioApiDto) {}
