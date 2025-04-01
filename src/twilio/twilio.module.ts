import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioController } from './twilio.controller';

@Module({
  controllers: [TwilioController],
  providers: [TwilioService],
})
export class TwilioModule {}
