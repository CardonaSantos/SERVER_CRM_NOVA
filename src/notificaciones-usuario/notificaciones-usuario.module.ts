import { Module } from '@nestjs/common';
import { NotificacionesUsuarioService } from './app/notificaciones-usuario.service';
import { NotificacionesUsuarioController } from './presentation/notificaciones-usuario.controller';
import { NOTIFICACION_USUARIO } from './domain/notificaciones-usuario-repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaNotificationUsuario } from './infraestructure/prisma-notification-usuario.repo';

@Module({
  imports: [PrismaModule],
  controllers: [NotificacionesUsuarioController],
  providers: [
    NotificacionesUsuarioService,
    {
      provide: NOTIFICACION_USUARIO,
      useClass: PrismaNotificationUsuario,
    },
  ],
  exports: [NotificacionesUsuarioService],
})
export class NotificacionesUsuarioModule {}
