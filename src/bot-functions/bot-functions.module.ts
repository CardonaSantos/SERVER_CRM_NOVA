import { Module } from '@nestjs/common';
import { BotFunctionsService } from './app/bot-functions.service';
import { BotFunctionsController } from './presentation/bot-functions.controller';
import { TicketsSoporteModule } from 'src/tickets-soporte/tickets-soporte.module';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  imports: [TicketsSoporteModule, NotificacionesModule],
  controllers: [BotFunctionsController],
  providers: [BotFunctionsService],
})
export class BotFunctionsModule {}
