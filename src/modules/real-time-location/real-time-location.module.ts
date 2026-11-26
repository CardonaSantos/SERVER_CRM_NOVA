import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GatewayModule } from 'src/web-sockets/websocket.module';
import { REAL_TIME_LOCATION_TRANSACTION } from './application/ports/real-time-location-transaction.port';
import { TECNICO_TRACKING_REALTIME } from './application/ports/tecnico-tracking-realtime.port';
import { ExpirarTecnicoTrackingUseCase } from './application/use-cases/expirar-tecnico-tracking.use-case';
import { FinalizarTecnicoTrackingUseCase } from './application/use-cases/finalizar-tecnico-tracking.use-case';
import { IniciarTecnicoTrackingUseCase } from './application/use-cases/iniciar-tecnico-tracking.use-case';
import { ListarHistorialTecnicoTrackingUseCase } from './application/use-cases/listar-historial-tecnico-tracking.use-case';
import { ListarTecnicosTrackingRealtimeUseCase } from './application/use-cases/listar-tecnicos-tracking-realtime.use-case';
import { ListarUbicacionesAsistenciaTrackingUseCase } from './application/use-cases/listar-ubicaciones-asistencia-tracking.use-case';
import { ListarUltimasUbicacionesUseCase } from './application/use-cases/listar-ultimas-ubicaciones.use-case';
import { ObtenerDetalleAsistenciaTrackingUseCase } from './application/use-cases/obtener-detalle-asistencia-tracking.use-case';
import { ObtenerEstadoTrackingTecnicoUseCase } from './application/use-cases/obtener-estado-tracking-tecnico.use-case';
import { RegistrarUbicacionTecnicoUseCase } from './application/use-cases/registrar-ubicacion-tecnico.use-case';
import { ASISTENCIA_TRACKING_QUERY } from './domain/ports/asistencia-tracking-query.port';
import { TECNICO_TRACKING_QUERY } from './domain/ports/tecnico-tracking-query.port';
import { TECNICO_TRACKING_REPOSITORY } from './domain/ports/tecnico-tracking-repository.port';
import { ULTIMA_UBICACION_QUERY } from './domain/ports/ultima-ubicacion-query.port';
import { AsistenciaTrackingPrismaQuery } from './infra/prisma/asistencia-tracking-prisma.query';
import { RealTimeLocationPrismaTransaction } from './infra/prisma/real-time-location-prisma.transaction';
import { TecnicoTrackingPrismaQuery } from './infra/prisma/tecnico-tracking-prisma.query';
import { TecnicoTrackingPrismaRepository } from './infra/prisma/tecnico-tracking-prisma.repository';
import { UltimaUbicacionPrismaQuery } from './infra/prisma/ultima-ubicacion-prisma.query';
import { TecnicoTrackingWebSocketAdapter } from './infra/websocket/tecnico-tracking-websocket.adapter';
import { TecnicoTrackingExpiracionCron } from './presentation/cron/tecnico-tracking-expiracion.cron';
import { RealTimeLocationController } from './presentation/http/real-time-location.controller';
import { UltimaUbicacionController } from './presentation/http/ultima-ubicacion.controller';

/**
 * Tracking en vivo de técnicos (sesiones, ubicaciones, jornada y última
 * posición de cada usuario).
 *
 * API pública (`public/`): los tipos de `real-time-location.types.ts`.
 */
@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [RealTimeLocationController, UltimaUbicacionController],
  providers: [
    // Casos de uso
    IniciarTecnicoTrackingUseCase,
    ObtenerEstadoTrackingTecnicoUseCase,
    RegistrarUbicacionTecnicoUseCase,
    FinalizarTecnicoTrackingUseCase,
    ExpirarTecnicoTrackingUseCase,
    ListarHistorialTecnicoTrackingUseCase,
    ListarTecnicosTrackingRealtimeUseCase,
    ObtenerDetalleAsistenciaTrackingUseCase,
    ListarUbicacionesAsistenciaTrackingUseCase,
    ListarUltimasUbicacionesUseCase,

    // Cron
    TecnicoTrackingExpiracionCron,

    // Adaptadores
    {
      provide: TECNICO_TRACKING_REPOSITORY,
      useClass: TecnicoTrackingPrismaRepository,
    },
    {
      provide: REAL_TIME_LOCATION_TRANSACTION,
      useClass: RealTimeLocationPrismaTransaction,
    },
    {
      provide: TECNICO_TRACKING_QUERY,
      useClass: TecnicoTrackingPrismaQuery,
    },
    {
      provide: ASISTENCIA_TRACKING_QUERY,
      useClass: AsistenciaTrackingPrismaQuery,
    },
    {
      provide: ULTIMA_UBICACION_QUERY,
      useClass: UltimaUbicacionPrismaQuery,
    },
    {
      provide: TECNICO_TRACKING_REALTIME,
      useClass: TecnicoTrackingWebSocketAdapter,
    },
  ],
})
export class RealTimeLocationModule {}
