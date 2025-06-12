import { Module } from '@nestjs/common';
import { TwilioApiService } from './twilio-api.service';
import { TwilioApiController } from './twilio-api.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [TwilioApiController],
  providers: [TwilioApiService, ConfigService],
})
export class TwilioApiModule {}
