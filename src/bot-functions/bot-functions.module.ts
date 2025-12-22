import { Module } from '@nestjs/common';
import { BotFunctionsService } from './app/bot-functions.service';
import { BotFunctionsController } from './presentation/bot-functions.controller';
import { TicketsSoporteModule } from 'src/tickets-soporte/tickets-soporte.module';

@Module({
  imports: [TicketsSoporteModule],
  controllers: [BotFunctionsController],
  providers: [BotFunctionsService],
})
export class BotFunctionsModule {}
