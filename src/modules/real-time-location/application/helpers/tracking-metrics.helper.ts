import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

export type TrackingSessionMetricInput = {
  estado: EstadoTrackingTecnico;

  iniciadoEn: Date;

  finalizadoEn: Date | null;

  ultimoHeartbeatEn: Date;
};

/**
 * Calcula únicamente tiempo confirmado.
 *
 * FINALIZADA / EXPIRADA:
 * finalizadoEn - iniciadoEn
 *
 * ACTIVA:
 * ultimoHeartbeatEn - iniciadoEn
 *
 * Nunca utiliza Date.now().
 */
export function calculateConfirmedTrackingMinutes(
  session: TrackingSessionMetricInput,
): number {
  const end =
    session.estado === EstadoTrackingTecnico.ACTIVA
      ? session.ultimoHeartbeatEn
      : session.finalizadoEn;

  if (!end) {
    return 0;
  }

  const milliseconds = end.getTime() - session.iniciadoEn.getTime();

  if (milliseconds <= 0) {
    return 0;
  }

  return Math.floor(milliseconds / 60_000);
}

export function calculateTotalConfirmedTrackingMinutes(
  sessions: TrackingSessionMetricInput[],
): number {
  return sessions.reduce(
    (total, session) => total + calculateConfirmedTrackingMinutes(session),
    0,
  );
}

export function calculateAttendanceMinutes(params: {
  horaEntrada: Date;
  horaSalida: Date | null;
}): number | null {
  if (!params.horaSalida) {
    return null;
  }

  const milliseconds =
    params.horaSalida.getTime() - params.horaEntrada.getTime();

  return Math.max(0, Math.floor(milliseconds / 60_000));
}

export function calculateMinutesWithoutTracking(params: {
  minutosJornada: number | null;
  minutosTracking: number;
}): number | null {
  if (params.minutosJornada === null) {
    return null;
  }

  return Math.max(0, params.minutosJornada - params.minutosTracking);
}
