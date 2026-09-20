import { strict as assert } from 'node:assert';

import {
  ConflictException,
  HttpException,
  Injectable,
  Module,
} from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { EstadoTrackingTecnico as PrismaEstadoTrackingTecnico } from '@prisma/client';

import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { EstadoTrackingTecnico } from 'src/modules/real-time-location/domain/enums/estado-tracking-tecnico.enum';

import {
  TecnicoTrackingRealtimePort,
  TecnicoTrackingStateChangedPayload,
} from 'src/modules/real-time-location/domain/ports/tecnico-tracking-realtime.port';

import { TecnicoTrackingRealtimeView } from 'src/modules/real-time-location/domain/ports/tecnico-tracking-query.port';

import {
  ASISTENCIA_TRACKING_PORT,
  TECNICO_TRACKING_QUERY,
  TECNICO_TRACKING_REALTIME,
  TECNICO_TRACKING_REPOSITORY,
} from 'src/modules/real-time-location/infra/tokens/tokens';

import { TecnicoTrackingPrismaRepository } from 'src/modules/real-time-location/infra/prisma/tecnico-tracking.prisma.repository';

import { TecnicoTrackingPrismaQuery } from 'src/modules/real-time-location/infra/prisma/tecnico-tracking.prisma.query';

import { AsistenciaTrackingPrismaAdapter } from 'src/modules/real-time-location/infra/prisma/asistencia-tracking.prisma.adapter';

import { IniciarTecnicoTrackingUseCase } from 'src/modules/real-time-location/application/use-cases/iniciar-tecnico-tracking.use-case';

import { ObtenerEstadoTrackingTecnicoUseCase } from 'src/modules/real-time-location/application/use-cases/obtener-estado-tracking-tecnico.use-case';

import { RegistrarUbicacionTecnicoUseCase } from 'src/modules/real-time-location/application/use-cases/registrar-ubicacion-tecnico.use-case';

import { FinalizarTecnicoTrackingUseCase } from 'src/modules/real-time-location/application/use-cases/finalizar-tecnico-tracking.use-case';

import { ListarHistorialTecnicoTrackingUseCase } from 'src/modules/real-time-location/application/use-cases/listar-historial-tecnico-tracking.use-case';

import { ObtenerDetalleAsistenciaTrackingUseCase } from 'src/modules/real-time-location/application/use-cases/obtener-detalle-asistencia-tracking.use-case';

import { ListarUbicacionesAsistenciaTrackingUseCase } from 'src/modules/real-time-location/application/use-cases/listar-ubicaciones-asistencia-tracking.use-case';

import { ExpirarTecnicoTrackingUseCase } from 'src/modules/real-time-location/application/use-cases/expirar-tecnico-tracking.use-case';

import { getTrackingBusinessDate } from 'src/modules/real-time-location/application/helpers/tracking-date.helper';

/**
 * ============================================================
 * REALTIME FAKE / RECORDER
 * ============================================================
 *
 * No utilizamos GatewayModule en este smoke.
 *
 * La finalidad es comprobar que los casos de uso llaman
 * correctamente al puerto realtime después de persistir.
 *
 * El Socket.IO real se probará posteriormente como smoke E2E.
 */
@Injectable()
class SmokeTrackingRealtimeRecorder implements TecnicoTrackingRealtimePort {
  readonly locationEvents: TecnicoTrackingRealtimeView[] = [];

  readonly stateEvents: TecnicoTrackingStateChangedPayload[] = [];

  async emitLocationUpdated(
    payload: TecnicoTrackingRealtimeView,
  ): Promise<void> {
    this.locationEvents.push(payload);
  }

  async emitTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void> {
    this.stateEvents.push(payload);
  }
}

/**
 * ============================================================
 * MÓDULO SMOKE
 * ============================================================
 *
 * Intencionalmente NO importamos:
 *
 * - AppModule
 * - GatewayModule
 * - ScheduleModule
 *
 * Queremos probar exclusivamente:
 *
 * application
 * domain
 * Prisma real
 * concurrencia
 * puertos realtime
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
  ],

  providers: [
    IniciarTecnicoTrackingUseCase,

    ObtenerEstadoTrackingTecnicoUseCase,

    RegistrarUbicacionTecnicoUseCase,

    FinalizarTecnicoTrackingUseCase,

    ListarHistorialTecnicoTrackingUseCase,

    ObtenerDetalleAsistenciaTrackingUseCase,

    ListarUbicacionesAsistenciaTrackingUseCase,

    ExpirarTecnicoTrackingUseCase,

    SmokeTrackingRealtimeRecorder,

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

    {
      provide: TECNICO_TRACKING_REALTIME,
      useExisting: SmokeTrackingRealtimeRecorder,
    },
  ],
})
class RealTimeLocationSmokeModule {}

type SmokeConfig = {
  userId: number;

  startConcurrency: number;

  sequentialGps: number;

  concurrentGps: number;

  raceGps: number;

  testExpiration: boolean;
};

type SmokePoint = {
  latitud: number;

  longitud: number;

  precision: number;

  velocidad: number;

  bateria: number;

  capturadoEn: string;
};

const SAFETY_VALUE = 'YES_REAL_TRACKING_SMOKE';

const PROD_SAFETY_VALUE = 'YES_REAL_TRACKING_SMOKE_ON_PRODUCTION';

const EXPIRATION_SAFETY_VALUE = 'YES_REAL_TRACKING_EXPIRATION';

const SCRIPT_NAME = 'smoke-real-time-location/1.0';

/**
 * Coordenada base únicamente para generar
 * puntos GPS sintéticos válidos.
 *
 * Cada punto se desplaza ligeramente.
 */
const BASE_LATITUDE = 15.67;
const BASE_LONGITUDE = -91.71;

async function main(): Promise<void> {
  assertSafetySwitch();

  const config = readConfig();

  printHeader(config);

  const app = await NestFactory.createApplicationContext(
    RealTimeLocationSmokeModule,
    {
      logger: ['error', 'warn'],
    },
  );

  const prisma = app.get(PrismaService);

  const iniciarTracking = app.get(IniciarTecnicoTrackingUseCase);

  const obtenerEstado = app.get(ObtenerEstadoTrackingTecnicoUseCase);

  const registrarUbicacion = app.get(RegistrarUbicacionTecnicoUseCase);

  const finalizarTracking = app.get(FinalizarTecnicoTrackingUseCase);

  const listarHistorial = app.get(ListarHistorialTecnicoTrackingUseCase);

  const obtenerDetalle = app.get(ObtenerDetalleAsistenciaTrackingUseCase);

  const listarUbicaciones = app.get(ListarUbicacionesAsistenciaTrackingUseCase);

  const expirarTracking = app.get(ExpirarTecnicoTrackingUseCase);

  const realtime = app.get(SmokeTrackingRealtimeRecorder);

  try {
    /**
     * ========================================================
     * 0. PREFLIGHT
     * ========================================================
     */

    printStep(0, 'Validaciones previas');

    const target = await resolveAndValidateTarget(prisma, config.userId);

    console.log(`Usuario:     ${target.id}`);

    console.log(`Nombre:      ${target.nombre}`);

    console.log(`Rol actual:  ${target.rol}`);

    console.log(`Activo:      ${target.activo}`);

    const activeBefore = await prisma.tecnicoTrackingSesion.findFirst({
      where: {
        tecnicoId: config.userId,

        estado: PrismaEstadoTrackingTecnico.ACTIVA,
      },
    });

    assert.equal(
      activeBefore,
      null,
      [
        '',
        'PREFLIGHT FALLÓ:',
        `el usuario ${config.userId} ya posee una sesión ACTIVA.`,
        '',
        'Este smoke no cerrará ni reutilizará automáticamente',
        'una sesión real existente.',
        '',
      ].join('\n'),
    );

    const businessDate = getTrackingBusinessDate(new Date());

    const attendanceBefore = await prisma.asistencia.findUnique({
      where: {
        usuarioId_fecha: {
          usuarioId: config.userId,

          fecha: businessDate,
        },
      },
    });

    /**
     * Si hay una jornada abierta sin sesión activa,
     * preferimos abortar.
     *
     * Podría representar un dato operativo real
     * que no queremos cerrar accidentalmente.
     */
    if (attendanceBefore && attendanceBefore.horaSalida === null) {
      throw new Error(
        [
          '',
          'PREFLIGHT FALLÓ:',
          'Existe una asistencia abierta para hoy,',
          'pero no existe una sesión de tracking ACTIVA.',
          '',
          `asistenciaId=${attendanceBefore.id}`,
          '',
          'Utiliza un usuario de prueba o cierra/revisa',
          'esa jornada antes de ejecutar el smoke.',
        ].join('\n'),
      );
    }

    console.log('Validaciones previas: OK');

    /**
     * ========================================================
     * 1. START ↔ START CONCURRENTES
     * ========================================================
     */

    printStep(1, 'START concurrente e idempotencia');

    const concurrentStarts = await Promise.all(
      Array.from(
        {
          length: config.startConcurrency,
        },

        () =>
          iniciarTracking.execute({
            tecnicoId: config.userId,
          }),
      ),
    );

    const sessionIds = new Set(
      concurrentStarts.map((result) => result.sesionTrackingId),
    );

    const attendanceIds = new Set(
      concurrentStarts.map((result) => result.asistenciaId),
    );

    assert.equal(
      sessionIds.size,
      1,
      'START concurrente creó más de una sesión.',
    );

    assert.equal(
      attendanceIds.size,
      1,
      'START concurrente devolvió más de una asistencia.',
    );

    const firstStart = concurrentStarts[0];

    const firstSessionId = firstStart.sesionTrackingId;

    const attendanceId = firstStart.asistenciaId;

    assert.equal(firstStart.estado, EstadoTrackingTecnico.ACTIVA);

    const activeCount = await prisma.tecnicoTrackingSesion.count({
      where: {
        tecnicoId: config.userId,

        estado: PrismaEstadoTrackingTecnico.ACTIVA,
      },
    });

    assert.equal(
      activeCount,
      1,
      'La DB posee más de una sesión ACTIVA después del START concurrente.',
    );

    console.log(`Sesión ACTIVA:      ${firstSessionId}`);

    console.log(`Asistencia:         ${attendanceId}`);

    console.log(`Requests START:     ${config.startConcurrency}`);

    console.log('Sesiones creadas:   1');

    /**
     * Retry normal.
     */

    const retryStart = await iniciarTracking.execute({
      tecnicoId: config.userId,
    });

    assert.equal(
      retryStart.sesionTrackingId,
      firstSessionId,
      'START idempotente devolvió otra sesión.',
    );

    assert.equal(
      retryStart.asistenciaId,
      attendanceId,
      'START idempotente devolvió otra asistencia.',
    );

    console.log('Retry START:        OK');

    /**
     * ========================================================
     * 2. GET /tracking/me LÓGICO
     * ========================================================
     */

    printStep(2, 'Estado actual del tracking');

    const activeState = await obtenerEstado.execute({
      tecnicoId: config.userId,
    });

    assert.equal(activeState.activo, true);

    assert.equal(activeState.sesionTrackingId, firstSessionId);

    assert.equal(activeState.asistenciaId, attendanceId);

    console.log('Estado lógico:      ACTIVO');

    /**
     * ========================================================
     * 3. GPS SECUENCIALES
     * ========================================================
     */

    printStep(3, 'Registro secuencial de GPS');

    const sequentialPoints = buildSmokePoints(config.sequentialGps, 0);

    for (let index = 0; index < sequentialPoints.length; index += 1) {
      const point = sequentialPoints[index];

      const result = await registrarUbicacion.execute({
        tecnicoId: config.userId,

        sesionTrackingId: firstSessionId,

        ...point,
      });

      assert.equal(result.sesionTrackingId, firstSessionId);

      assert.equal(result.estado, EstadoTrackingTecnico.ACTIVA);

      console.log(
        `GPS secuencial ${index + 1}/${sequentialPoints.length} -> ubicacionId=${result.ubicacionId}`,
      );
    }

    /**
     * ========================================================
     * 4. GPS ↔ GPS CONCURRENTES
     * ========================================================
     */

    printStep(4, 'Concurrencia GPS ↔ GPS');

    const concurrentPoints = buildSmokePoints(
      config.concurrentGps,
      config.sequentialGps,
    );

    const concurrentGpsResults = await Promise.all(
      concurrentPoints.map((point) =>
        registrarUbicacion.execute({
          tecnicoId: config.userId,

          sesionTrackingId: firstSessionId,

          ...point,
        }),
      ),
    );

    assert.equal(concurrentGpsResults.length, config.concurrentGps);

    const totalFirstSessionPoints = config.sequentialGps + config.concurrentGps;

    const firstSessionDb = await prisma.tecnicoTrackingSesion.findUnique({
      where: {
        id: firstSessionId,
      },
    });

    assert.ok(firstSessionDb, 'La primera sesión desapareció.');

    assert.equal(firstSessionDb.estado, PrismaEstadoTrackingTecnico.ACTIVA);

    const firstLocationCount = await prisma.ubicacionTecnico.count({
      where: {
        sesionTrackingId: firstSessionId,
      },
    });

    assert.equal(
      firstLocationCount,
      totalFirstSessionPoints,
      'No todos los GPS válidos quedaron en histórico.',
    );

    console.log(`GPS concurrentes:   ${config.concurrentGps}`);

    console.log(`Históricos sesión:  ${firstLocationCount}`);

    /**
     * UbicaciónActual debe existir.
     */

    const currentLocation = await prisma.ubicacionActual.findUnique({
      where: {
        usuarioId: config.userId,
      },
    });

    assert.ok(currentLocation, 'UbicacionActual no fue creada/actualizada.');

    console.log('UbicacionActual:    OK');

    /**
     * Cada GPS exitoso debe solicitar una
     * actualización realtime.
     */

    assert.equal(
      realtime.locationEvents.length,
      totalFirstSessionPoints,
      'No se emitió un evento realtime por cada GPS persistido.',
    );

    console.log(`Eventos location:   ${realtime.locationEvents.length}`);

    /**
     * ========================================================
     * 5. HISTORIAL / DETALLE / RECORRIDO
     * ========================================================
     */

    printStep(5, 'Read models administrativos');

    const history = await listarHistorial.execute({
      page: 1,

      limit: 100,

      tecnicoId: config.userId,
    });

    const historyItem = history.items.find(
      (item) => item.asistenciaId === attendanceId,
    );

    assert.ok(historyItem, 'La asistencia del smoke no aparece en history.');

    assert.equal(historyItem.tracking.haySesionActiva, true);

    const detailBeforeFinish = await obtenerDetalle.execute({
      asistenciaId: attendanceId,
    });

    assert.equal(detailBeforeFinish.resumen.haySesionActiva, true);

    const firstSessionDetail = detailBeforeFinish.sesiones.find(
      (session) => session.id === firstSessionId,
    );

    assert.ok(
      firstSessionDetail,
      'La primera sesión no aparece en el detalle.',
    );

    assert.equal(firstSessionDetail.puntosRegistrados, totalFirstSessionPoints);

    const route = await listarUbicaciones.execute({
      asistenciaId: attendanceId,

      sesionTrackingId: firstSessionId,

      page: 1,

      limit: 1000,
    });

    assert.equal(route.total, totalFirstSessionPoints);

    assert.ok(
      route.items.every((item) => item.sesionTrackingId === firstSessionId),
      'El recorrido contiene ubicaciones de otra sesión.',
    );

    console.log(`History:            OK`);

    console.log(`Detalle:            OK`);

    console.log(`Recorrido:          ${route.total} puntos`);

    /**
     * ========================================================
     * 6. OFF NORMAL
     * ========================================================
     */

    printStep(6, 'Finalización normal e idempotencia');

    const stateEventsBeforeFinish = realtime.stateEvents.length;

    const finished = await finalizarTracking.execute({
      tecnicoId: config.userId,

      sesionTrackingId: firstSessionId,
    });

    assert.equal(finished.estado, EstadoTrackingTecnico.FINALIZADA);

    assert.ok(finished.finalizadoEn);

    assert.ok(finished.horaSalida);

    assert.equal(
      realtime.stateEvents.length,
      stateEventsBeforeFinish + 1,
      'OFF real no emitió state-changed.',
    );

    const stateEventsBeforeRetry = realtime.stateEvents.length;

    const finishedRetry = await finalizarTracking.execute({
      tecnicoId: config.userId,

      sesionTrackingId: firstSessionId,
    });

    assert.equal(
      finishedRetry.finalizadoEn.getTime(),
      finished.finalizadoEn.getTime(),
      'Retry OFF cambió finalizadoEn.',
    );

    assert.equal(
      realtime.stateEvents.length,
      stateEventsBeforeRetry,
      'Retry OFF histórico emitió un evento Socket nuevo.',
    );

    const inactiveState = await obtenerEstado.execute({
      tecnicoId: config.userId,
    });

    assert.equal(inactiveState.activo, false);

    console.log('OFF:                FINALIZADA');

    console.log('Retry OFF:          idempotente');

    console.log('Estado actual:      INACTIVO');

    /**
     * ========================================================
     * 7. REACTIVACIÓN MISMO DÍA
     * ========================================================
     */

    printStep(7, 'Reactivación de jornada');

    const attendanceAfterFirstFinish = await prisma.asistencia.findUnique({
      where: {
        id: attendanceId,
      },
    });

    assert.ok(attendanceAfterFirstFinish);

    assert.ok(
      attendanceAfterFirstFinish.horaSalida,
      'La primera salida no fue persistida.',
    );

    const originalEntry = attendanceAfterFirstFinish.horaEntrada;

    await delay(10);

    const secondStart = await iniciarTracking.execute({
      tecnicoId: config.userId,
    });

    assert.equal(
      secondStart.asistenciaId,
      attendanceId,
      'La reactivación creó otra asistencia el mismo día.',
    );

    assert.notEqual(
      secondStart.sesionTrackingId,
      firstSessionId,
      'La reactivación reutilizó una sesión cerrada.',
    );

    const secondSessionId = secondStart.sesionTrackingId;

    const reopenedAttendance = await prisma.asistencia.findUnique({
      where: {
        id: attendanceId,
      },
    });

    assert.ok(reopenedAttendance);

    assert.equal(
      reopenedAttendance.horaSalida,
      null,
      'La asistencia no fue reabierta.',
    );

    assert.equal(
      reopenedAttendance.horaEntrada.getTime(),
      originalEntry.getTime(),
      'La reactivación reemplazó la primera horaEntrada.',
    );

    console.log(`Nueva sesión:       ${secondSessionId}`);

    console.log(`Misma asistencia:   ${attendanceId}`);

    console.log('horaEntrada:        preservada');

    console.log('horaSalida:         null');

    /**
     * ========================================================
     * 8. GPS ↔ OFF
     * ========================================================
     */

    printStep(8, 'Condición de carrera GPS ↔ OFF');

    const racePoints = buildSmokePoints(
      config.raceGps,
      totalFirstSessionPoints + 100,
    );

    const raceResults = await Promise.allSettled([
      finalizarTracking.execute({
        tecnicoId: config.userId,

        sesionTrackingId: secondSessionId,
      }),

      ...racePoints.map((point) =>
        registrarUbicacion.execute({
          tecnicoId: config.userId,

          sesionTrackingId: secondSessionId,

          ...point,
        }),
      ),
    ]);

    const finishRaceResult = raceResults[0];

    assert.equal(
      finishRaceResult.status,
      'fulfilled',
      [
        'El OFF falló durante la carrera GPS ↔ OFF.',
        finishRaceResult.status === 'rejected'
          ? String(finishRaceResult.reason)
          : '',
      ].join('\n'),
    );

    let raceGpsSucceeded = 0;

    let raceGpsRejectedAsExpected = 0;

    for (let index = 1; index < raceResults.length; index += 1) {
      const result = raceResults[index];

      if (result.status === 'fulfilled') {
        raceGpsSucceeded += 1;

        continue;
      }

      if (isConflictException(result.reason)) {
        raceGpsRejectedAsExpected += 1;

        continue;
      }

      throw result.reason;
    }

    const secondSessionDb = await prisma.tecnicoTrackingSesion.findUnique({
      where: {
        id: secondSessionId,
      },
    });

    assert.ok(secondSessionDb);

    assert.equal(
      secondSessionDb.estado,
      PrismaEstadoTrackingTecnico.FINALIZADA,
      'La carrera dejó la sesión en estado incorrecto.',
    );

    assert.ok(secondSessionDb.finalizadoEn);

    const activeAfterRace = await prisma.tecnicoTrackingSesion.count({
      where: {
        tecnicoId: config.userId,

        estado: PrismaEstadoTrackingTecnico.ACTIVA,
      },
    });

    assert.equal(activeAfterRace, 0, 'La carrera dejó una sesión ACTIVA.');

    console.log(`GPS enviados:       ${config.raceGps}`);

    console.log(`GPS aceptados:      ${raceGpsSucceeded}`);

    console.log(`GPS rechazados 409: ${raceGpsRejectedAsExpected}`);

    console.log('OFF final:          FINALIZADA');

    /**
     * Un GPS posterior al cierre DEBE fallar.
     */

    const secondCountBeforeLateGps = await prisma.ubicacionTecnico.count({
      where: {
        sesionTrackingId: secondSessionId,
      },
    });

    await expectConflict(
      () =>
        registrarUbicacion.execute({
          tecnicoId: config.userId,

          sesionTrackingId: secondSessionId,

          ...buildSmokePoints(1, 999)[0],
        }),

      'GPS posterior al OFF',
    );

    const secondCountAfterLateGps = await prisma.ubicacionTecnico.count({
      where: {
        sesionTrackingId: secondSessionId,
      },
    });

    assert.equal(
      secondCountAfterLateGps,
      secondCountBeforeLateGps,
      'Se insertó un GPS después de FINALIZADA.',
    );

    console.log('GPS después OFF:    rechazado correctamente');

    /**
     * ========================================================
     * 9. DETALLE FINAL
     * ========================================================
     */

    printStep(9, 'Consistencia final de la jornada');

    const finalDetail = await obtenerDetalle.execute({
      asistenciaId: attendanceId,
    });

    const firstFinalSession = finalDetail.sesiones.find(
      (session) => session.id === firstSessionId,
    );

    const secondFinalSession = finalDetail.sesiones.find(
      (session) => session.id === secondSessionId,
    );

    assert.ok(firstFinalSession);

    assert.ok(secondFinalSession);

    assert.equal(firstFinalSession.estado, EstadoTrackingTecnico.FINALIZADA);

    assert.equal(secondFinalSession.estado, EstadoTrackingTecnico.FINALIZADA);

    assert.equal(finalDetail.resumen.haySesionActiva, false);

    assert.ok(finalDetail.asistencia.horaSalida);

    console.log(`Sesiones smoke:     2`);

    console.log(`Primera:            ${firstFinalSession.estado}`);

    console.log(`Segunda:            ${secondFinalSession.estado}`);

    console.log(`Min tracking:       ${finalDetail.resumen.minutosTracking}`);

    console.log(
      `Min jornada:        ${finalDetail.resumen.minutosJornada ?? '-'}`,
    );

    /**
     * ========================================================
     * 10. EXPIRACIÓN OPCIONAL
     * ========================================================
     *
     * El use case de expiración busca GLOBALMENTE
     * sesiones stale.
     *
     * No lo ejecutamos de manera automática sobre
     * una DB que pueda tener otros usuarios activos.
     */
    if (config.testExpiration) {
      printStep(10, 'Expiración controlada');

      await runControlledExpirationTest({
        prisma,

        userId: config.userId,

        iniciarTracking,

        obtenerEstado,

        expirarTracking,

        realtime,
      });
    } else {
      console.log('');
      console.log('Expiración automática: OMITIDA');

      console.log('Para probarla explícitamente:');

      console.log(`TRACKING_SMOKE_EXPIRATION=${EXPIRATION_SAFETY_VALUE}`);
    }

    /**
     * ========================================================
     * RESULTADO
     * ========================================================
     */

    console.log('');
    console.log('============================================================');

    console.log(' SMOKE REAL - TRACKING: OK');

    console.log('============================================================');

    console.log(`usuarioId:              ${config.userId}`);

    console.log(`asistenciaId:           ${attendanceId}`);

    console.log(`sesion #1:              ${firstSessionId}`);

    console.log(`sesion #2:              ${secondSessionId}`);

    console.log(`GPS sesión #1:          ${totalFirstSessionPoints}`);

    console.log(`GPS carrera aceptados:  ${raceGpsSucceeded}`);

    console.log(`eventos ubicación:      ${realtime.locationEvents.length}`);

    console.log(`eventos estado:         ${realtime.stateEvents.length}`);

    console.log('============================================================');
  } finally {
    await app.close();
  }
}

/**
 * ============================================================
 * EXPIRACIÓN CONTROLADA
 * ============================================================
 *
 * MUY IMPORTANTE:
 *
 * ExpirarTecnicoTrackingUseCase busca sesiones stale
 * globalmente, no por usuario.
 *
 * Por eso esta prueba solamente corre cuando no existe
 * ninguna otra sesión ACTIVA en la DB.
 */
async function runControlledExpirationTest(params: {
  prisma: PrismaService;

  userId: number;

  iniciarTracking: IniciarTecnicoTrackingUseCase;

  obtenerEstado: ObtenerEstadoTrackingTecnicoUseCase;

  expirarTracking: ExpirarTecnicoTrackingUseCase;

  realtime: SmokeTrackingRealtimeRecorder;
}): Promise<void> {
  const existingActives = await params.prisma.tecnicoTrackingSesion.findMany({
    where: {
      estado: PrismaEstadoTrackingTecnico.ACTIVA,
    },

    select: {
      id: true,

      tecnicoId: true,

      ultimoHeartbeatEn: true,
    },
  });

  assert.equal(
    existingActives.length,
    0,
    [
      '',
      'No es seguro ejecutar el smoke de expiración.',
      '',
      'Existen otras sesiones ACTIVA en la base.',
      '',
      JSON.stringify(existingActives, null, 2),
    ].join('\n'),
  );

  const started = await params.iniciarTracking.execute({
    tecnicoId: params.userId,
  });

  const sessionId = started.sesionTrackingId;

  /**
   * Revalidamos inmediatamente antes de expirar.
   */
  const activeRows = await params.prisma.tecnicoTrackingSesion.findMany({
    where: {
      estado: PrismaEstadoTrackingTecnico.ACTIVA,
    },

    select: {
      id: true,

      tecnicoId: true,

      ultimoHeartbeatEn: true,
    },
  });

  assert.equal(
    activeRows.length,
    1,
    'Apareció otra sesión ACTIVA durante la preparación de expiración.',
  );

  assert.equal(activeRows[0].id, sessionId);

  assert.equal(activeRows[0].tecnicoId, params.userId);

  const heartbeat = activeRows[0].ultimoHeartbeatEn;

  const stateEventsBefore = params.realtime.stateEvents.length;

  /**
   * En producción el scheduler pasa:
   *
   * now - 2 horas.
   *
   * Para no esperar dos horas en el smoke,
   * colocamos el umbral 1 ms después del heartbeat.
   *
   * La semántica del use case es exactamente la misma.
   */
  const result = await params.expirarTracking.execute({
    heartbeatBefore: new Date(heartbeat.getTime() + 1),

    limit: 500,
  });

  const expired = result.sesionesExpiradas.find(
    (session) => session.sesionTrackingId === sessionId,
  );

  assert.ok(expired, 'La sesión preparada no fue expirada.');

  assert.equal(
    expired.finalizadoEn.getTime(),
    expired.ultimoHeartbeatEn.getTime(),
    'EXPIRADA no finalizó exactamente en ultimoHeartbeatEn.',
  );

  const persisted = await params.prisma.tecnicoTrackingSesion.findUnique({
    where: {
      id: sessionId,
    },
  });

  assert.ok(persisted);

  assert.equal(persisted.estado, PrismaEstadoTrackingTecnico.EXPIRADA);

  assert.ok(persisted.finalizadoEn);

  assert.equal(
    persisted.finalizadoEn.getTime(),
    persisted.ultimoHeartbeatEn.getTime(),
  );

  const state = await params.obtenerEstado.execute({
    tecnicoId: params.userId,
  });

  assert.equal(state.activo, false);

  assert.equal(
    params.realtime.stateEvents.length,
    stateEventsBefore + 1,
    'La expiración no emitió state-changed.',
  );

  const lastStateEvent =
    params.realtime.stateEvents[params.realtime.stateEvents.length - 1];

  assert.equal(lastStateEvent.estado, EstadoTrackingTecnico.EXPIRADA);

  console.log(`Sesión expirada:     ${sessionId}`);

  console.log(`Heartbeat:           ${heartbeat.toISOString()}`);

  console.log('finalizadoEn:        igual a heartbeat');

  console.log('Socket state:        EXPIRADA');
}

/**
 * ============================================================
 * TARGET
 * ============================================================
 */

async function resolveAndValidateTarget(prisma: PrismaService, userId: number) {
  const user = await prisma.usuario.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,

      nombre: true,

      rol: true,

      activo: true,
    },
  });

  assert.ok(user, `No existe Usuario id=${userId}.`);

  assert.equal(user.activo, true, `Usuario id=${userId} está inactivo.`);

  return user;
}

/**
 * ============================================================
 * GPS SYNTHETIC DATA
 * ============================================================
 */

function buildSmokePoints(count: number, offset: number): SmokePoint[] {
  const capturedBase = Date.now() - count * 2_000;

  return Array.from(
    {
      length: count,
    },

    (_, index) => {
      const sequence = offset + index + 1;

      return {
        latitud: BASE_LATITUDE + sequence * 0.00001,

        longitud: BASE_LONGITUDE + sequence * 0.00001,

        precision: 4 + (sequence % 6),

        velocidad: Number((sequence * 0.15).toFixed(2)),

        bateria: Math.max(5, 95 - (sequence % 70)),

        capturadoEn: new Date(capturedBase + index * 1_000).toISOString(),
      };
    },
  );
}

/**
 * ============================================================
 * EXPECTED CONFLICT
 * ============================================================
 */

async function expectConflict(
  operation: () => Promise<unknown>,
  label: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    if (isConflictException(error)) {
      return;
    }

    throw error;
  }

  throw new Error(`${label}: se esperaba HTTP 409 / ConflictException.`);
}

function isConflictException(error: unknown): boolean {
  if (error instanceof ConflictException) {
    return true;
  }

  if (error instanceof HttpException) {
    return error.getStatus() === 409;
  }

  return false;
}

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

function readConfig(): SmokeConfig {
  return {
    userId: readRequiredPositiveInteger('userId', 'TRACKING_SMOKE_USER_ID'),

    startConcurrency: readOptionalPositiveInteger(
      'startConcurrency',
      'TRACKING_SMOKE_START_CONCURRENCY',
      5,
    ),

    sequentialGps: readOptionalPositiveInteger(
      'sequentialGps',
      'TRACKING_SMOKE_SEQUENTIAL_GPS',
      3,
    ),

    concurrentGps: readOptionalPositiveInteger(
      'concurrentGps',
      'TRACKING_SMOKE_CONCURRENT_GPS',
      8,
    ),

    /**
     * Lo mantenemos pequeño para provocar carrera real
     * sin convertir el test en una prueba de carga.
     */
    raceGps: readOptionalPositiveInteger(
      'raceGps',
      'TRACKING_SMOKE_RACE_GPS',
      2,
    ),

    testExpiration:
      process.env.TRACKING_SMOKE_EXPIRATION === EXPIRATION_SAFETY_VALUE,
  };
}

function readRequiredPositiveInteger(
  argumentName: string,
  environmentName: string,
): number {
  const raw = readArgument(argumentName) ?? process.env[environmentName];

  if (!raw) {
    throw new Error(
      [
        `Falta ${environmentName}.`,
        '',
        'También puede enviarse como:',
        `--${argumentName}=123`,
      ].join('\n'),
    );
  }

  return parsePositiveInteger(raw, environmentName);
}

function readOptionalPositiveInteger(
  argumentName: string,
  environmentName: string,
  fallback: number,
): number {
  const raw = readArgument(argumentName) ?? process.env[environmentName];

  if (!raw) {
    return fallback;
  }

  return parsePositiveInteger(raw, environmentName);
}

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`;

  const argument = process.argv.find((value) => value.startsWith(prefix));

  return argument?.slice(prefix.length);
}

function parsePositiveInteger(raw: string, field: string): number {
  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} debe ser un entero positivo.`);
  }

  return value;
}

/**
 * ============================================================
 * SAFETY
 * ============================================================
 */

function assertSafetySwitch(): void {
  if (process.env.TRACKING_SMOKE_CONFIRM !== SAFETY_VALUE) {
    throw new Error(
      [
        '',
        'SMOKE REAL BLOQUEADO.',
        '',
        'Este script escribe datos reales:',
        '',
        '- Asistencia',
        '- TecnicoTrackingSesion',
        '- UbicacionTecnico',
        '- UbicacionActual',
        '',
        'Para habilitarlo:',
        '',
        `TRACKING_SMOKE_CONFIRM=${SAFETY_VALUE}`,
        '',
      ].join('\n'),
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.TRACKING_SMOKE_ALLOW_PRODUCTION !== PROD_SAFETY_VALUE
  ) {
    throw new Error(
      [
        '',
        'EJECUCIÓN EN PRODUCCIÓN BLOQUEADA.',
        '',
        'Si realmente quieres ejecutar este smoke',
        'contra producción debes habilitar además:',
        '',
        `TRACKING_SMOKE_ALLOW_PRODUCTION=${PROD_SAFETY_VALUE}`,
      ].join('\n'),
    );
  }
}

/**
 * ============================================================
 * OUTPUT
 * ============================================================
 */

function printHeader(config: SmokeConfig): void {
  console.log('');
  console.log('============================================================');

  console.log(' SMOKE REAL - REAL TIME LOCATION / TRACKING');

  console.log('============================================================');

  console.log(`script:                   ${SCRIPT_NAME}`);

  console.log(`usuarioId:                ${config.userId}`);

  console.log(`START concurrentes:       ${config.startConcurrency}`);

  console.log(`GPS secuenciales:         ${config.sequentialGps}`);

  console.log(`GPS concurrentes:         ${config.concurrentGps}`);

  console.log(`GPS carrera con OFF:      ${config.raceGps}`);

  console.log(
    `probar expiración:        ${config.testExpiration ? 'SÍ' : 'NO'}`,
  );

  console.log('============================================================');

  console.log('');
  console.log('ATENCIÓN: esta prueba modifica datos reales de tracking.');

  console.log('Utiliza preferiblemente un usuario dedicado a pruebas.');
}

function printStep(number: number, title: string): void {
  console.log('');
  console.log('------------------------------------------------------------');

  console.log(`[${number}] ${title}`);

  console.log('------------------------------------------------------------');
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error) => {
  console.error('');
  console.error('============================================================');

  console.error(' SMOKE REAL - TRACKING: FALLÓ');

  console.error('============================================================');

  console.error(error);

  process.exitCode = 1;
});
