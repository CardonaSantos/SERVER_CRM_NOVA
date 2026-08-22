import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

import { ExpirarTecnicoTrackingUseCase } from './application/use-cases/expirar-tecnico-tracking.use-case';

import { FinalizarTecnicoTrackingUseCase } from './application/use-cases/finalizar-tecnico-tracking.use-case';

import { IniciarTecnicoTrackingUseCase } from './application/use-cases/iniciar-tecnico-tracking.use-case';

import { ListarHistorialTecnicoTrackingUseCase } from './application/use-cases/listar-historial-tecnico-tracking.use-case';

import { ListarUbicacionesAsistenciaTrackingUseCase } from './application/use-cases/listar-ubicaciones-asistencia-tracking.use-case';

import { ObtenerDetalleAsistenciaTrackingUseCase } from './application/use-cases/obtener-detalle-asistencia-tracking.use-case';

import { RegistrarUbicacionTecnicoUseCase } from './application/use-cases/registrar-ubicacion-tecnico.use-case';

import { AsistenciaTrackingPrismaAdapter } from './infra/prisma/asistencia-tracking.prisma.adapter';

import { TecnicoTrackingPrismaQuery } from './infra/prisma/tecnico-tracking.prisma.query';

import { TecnicoTrackingPrismaRepository } from './infra/prisma/tecnico-tracking.prisma.repository';

import {
  ASISTENCIA_TRACKING_PORT,
  TECNICO_TRACKING_QUERY,
  TECNICO_TRACKING_REALTIME,
  TECNICO_TRACKING_REPOSITORY,
} from './infra/tokens/tokens';

import { RealTimeLocationController } from './presentation/controllers/real-time-location.controller';
import { TecnicoTrackingExpirationScheduler } from './infra/scheduler/tecnico-tracking-expiration.scheduler';
import { GatewayModule } from 'src/web-sockets/websocket.module';
import { TecnicoTrackingWebSocketAdapter } from './infra/realtime/tecnico-tracking.websocket.adapter';
import { ObtenerEstadoTrackingTecnicoUseCase } from './application/use-cases/obtener-estado-tracking-tecnico.use-case';

@Module({
  imports: [PrismaModule, AuthModule, GatewayModule],

  controllers: [RealTimeLocationController],

  providers: [
    IniciarTecnicoTrackingUseCase,

    RegistrarUbicacionTecnicoUseCase,

    FinalizarTecnicoTrackingUseCase,

    ExpirarTecnicoTrackingUseCase,

    ListarHistorialTecnicoTrackingUseCase,

    ObtenerDetalleAsistenciaTrackingUseCase,

    ListarUbicacionesAsistenciaTrackingUseCase,

    ObtenerEstadoTrackingTecnicoUseCase,

    // SCHEDULER
    TecnicoTrackingExpirationScheduler,

    {
      provide: TECNICO_TRACKING_REPOSITORY,

      useClass: TecnicoTrackingPrismaRepository,
    },

    {
      provide: ASISTENCIA_TRACKING_PORT,

      useClass: AsistenciaTrackingPrismaAdapter,
    },

    {
      provide: TECNICO_TRACKING_QUERY,

      useClass: TecnicoTrackingPrismaQuery,
    },

    // GATEWAY
    {
      provide: TECNICO_TRACKING_REALTIME,

      useClass: TecnicoTrackingWebSocketAdapter,
    },
  ],
})
export class RealTimeLocationModule {}
