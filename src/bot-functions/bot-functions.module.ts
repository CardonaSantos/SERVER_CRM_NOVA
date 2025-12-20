import { Module } from '@nestjs/common';
import { BotFunctionsService } from './app/bot-functions.service';
import { BotFunctionsController } from './presentation/bot-functions.controller';

@Module({
  controllers: [BotFunctionsController],
  providers: [BotFunctionsService],
})
export class BotFunctionsModule {}
