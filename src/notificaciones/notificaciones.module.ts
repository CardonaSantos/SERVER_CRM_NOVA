import { Module } from '@nestjs/common';
import { NotificacionesService } from './app/notificaciones.service';
import { NotificacionesController } from './presentation/notificaciones.controller';
import { NOTIFICATION_REPOSITORY } from './domain/notification-repository';
import { PrismaNotificationRepository } from './infraestructure/prisma-notification-respository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GatewayModule } from 'src/web-sockets/websocket.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
