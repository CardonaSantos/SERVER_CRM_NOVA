import { Module } from '@nestjs/common';

import { NotificacionFacade } from './application/facade/notificacion.facade';
import { ENVIADOR_PUSH } from './application/ports/enviador-push.port';
import { NOTIFICACION_EVENTOS } from './application/ports/notificacion-eventos.port';
import { ContarNotificacionesUseCase } from './application/use-cases/contar-notificaciones.use-case';
import { DescartarNotificacionUseCase } from './application/use-cases/descartar-notificacion.use-case';
import { DescartarNotificacionesUseCase } from './application/use-cases/descartar-notificaciones.use-case';
import { EnviarPushUseCase } from './application/use-cases/enviar-push.use-case';
import { ListarNotificacionesUseCase } from './application/use-cases/listar-notificaciones.use-case';
import { MarcarNotificacionLeidaUseCase } from './application/use-cases/marcar-notificacion-leida.use-case';
import { MarcarNotificacionesLeidasUseCase } from './application/use-cases/marcar-notificaciones-leidas.use-case';
import { NotificarUseCase } from './application/use-cases/notificar.use-case';
import { RegistrarDispositivoPushUseCase } from './application/use-cases/registrar-dispositivo-push.use-case';
import { RevocarDispositivoPushUseCase } from './application/use-cases/revocar-dispositivo-push.use-case';
import { RevocarDispositivosDeSesionesUseCase } from './application/use-cases/revocar-dispositivos-de-sesiones.use-case';
import { BANDEJA_NOTIFICACION_REPOSITORY } from './domain/ports/bandeja-notificacion-repository.port';
import { DISPOSITIVO_PUSH_REPOSITORY } from './domain/ports/dispositivo-push-repository.port';
import { NOTIFICACION_QUERY } from './domain/ports/notificacion-query.port';
import { NOTIFICACION_REPOSITORY } from './domain/ports/notificacion-repository.port';
import { EnviadorPushFirebaseAdapter } from './infra/firebase/enviador-push-firebase.adapter';
import { BandejaNotificacionPrismaRepository } from './infra/prisma/bandeja-notificacion-prisma.repository';
import { DispositivoPushPrismaRepository } from './infra/prisma/dispositivo-push-prisma.repository';
import { NotificacionPrismaQuery } from './infra/prisma/notificacion-prisma.query';
import { NotificacionPrismaRepository } from './infra/prisma/notificacion-prisma.repository';
import { NotificacionEventosWebsocketAdapter } from './infra/websocket/notificacion-eventos-websocket.adapter';
import { LimpiarNotificacionesUseCase } from './application/use-cases/limpiar-notificaciones.use-case';
import { LimpiezaNotificacionesCron } from './presentation/cron/limpieza-notificaciones.cron';
import { SesionesRevocadasListener } from './presentation/eventos/sesiones-revocadas.listener';
import { DispositivoPushController } from './presentation/http/dispositivo-push.controller';
import { NotificacionController } from './presentation/http/notificacion.controller';
import { NOTIFICACION } from './public/notificacion.facade.port';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TareasProgramadasModule } from 'src/modules/tareas-programadas/tareas-programadas.module';

/**
 * Avisos internos del CRM: bandeja de cada usuario, aviso en vivo y push al
 * teléfono (Firebase es un adaptador).
 *
 * API pública (`public/`): la fachada `NOTIFICACION`.
 */
@Module({
  imports: [PrismaModule, TareasProgramadasModule],
  controllers: [NotificacionController, DispositivoPushController],
  providers: [
    // Casos de uso
    NotificarUseCase,
    ListarNotificacionesUseCase,
    ContarNotificacionesUseCase,
    MarcarNotificacionLeidaUseCase,
    MarcarNotificacionesLeidasUseCase,
    DescartarNotificacionUseCase,
    DescartarNotificacionesUseCase,
    RegistrarDispositivoPushUseCase,
    RevocarDispositivoPushUseCase,
    RevocarDispositivosDeSesionesUseCase,
    EnviarPushUseCase,
    LimpiarNotificacionesUseCase,
    // Cron
    LimpiezaNotificacionesCron,
    // Eventos
    SesionesRevocadasListener,
    // Fachada
    NotificacionFacade,
    { provide: NOTIFICACION, useExisting: NotificacionFacade },
    // Adaptadores
    {
      provide: NOTIFICACION_REPOSITORY,
      useClass: NotificacionPrismaRepository,
    },
    {
      provide: BANDEJA_NOTIFICACION_REPOSITORY,
      useClass: BandejaNotificacionPrismaRepository,
    },
    { provide: NOTIFICACION_QUERY, useClass: NotificacionPrismaQuery },
    {
      provide: DISPOSITIVO_PUSH_REPOSITORY,
      useClass: DispositivoPushPrismaRepository,
    },
    { provide: ENVIADOR_PUSH, useClass: EnviadorPushFirebaseAdapter },
    {
      provide: NOTIFICACION_EVENTOS,
      useClass: NotificacionEventosWebsocketAdapter,
    },
  ],
  exports: [NOTIFICACION],
})
export class NotificacionModule {}
