import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';
import {
  calculateAttendanceMinutes,
  calculateConfirmedTrackingMinutes,
  calculateMinutesWithoutTracking,
  calculateTotalConfirmedTrackingMinutes,
  minutosEntre,
} from './metricas-tracking.policy';

const T0 = new Date('2026-11-25T14:00:00.000Z');
const T30 = new Date('2026-11-25T14:30:45.000Z');
const T60 = new Date('2026-11-25T15:00:00.000Z');

describe('metricas-tracking.policy', () => {
  describe('calculateConfirmedTrackingMinutes', () => {
    it('una sesión activa cuenta hasta su último heartbeat, no hasta ahora', () => {
      expect(
        calculateConfirmedTrackingMinutes({
          estado: EstadoTrackingTecnico.ACTIVA,
          iniciadoEn: T0,
          finalizadoEn: null,
          ultimoHeartbeatEn: T30,
        }),
      ).toBe(30);
    });

    it('una sesión cerrada cuenta hasta su fin', () => {
      expect(
        calculateConfirmedTrackingMinutes({
          estado: EstadoTrackingTecnico.FINALIZADA,
          iniciadoEn: T0,
          finalizadoEn: T60,
          ultimoHeartbeatEn: T30,
        }),
      ).toBe(60);
    });

    it('sin fin o con un fin anterior al inicio es 0', () => {
      expect(
        calculateConfirmedTrackingMinutes({
          estado: EstadoTrackingTecnico.EXPIRADA,
          iniciadoEn: T0,
          finalizadoEn: null,
          ultimoHeartbeatEn: T0,
        }),
      ).toBe(0);
      expect(
        calculateConfirmedTrackingMinutes({
          estado: EstadoTrackingTecnico.FINALIZADA,
          iniciadoEn: T60,
          finalizadoEn: T0,
          ultimoHeartbeatEn: T60,
        }),
      ).toBe(0);
    });
  });

  it('suma el tiempo confirmado de varias sesiones', () => {
    expect(
      calculateTotalConfirmedTrackingMinutes([
        {
          estado: EstadoTrackingTecnico.FINALIZADA,
          iniciadoEn: T0,
          finalizadoEn: T60,
          ultimoHeartbeatEn: T60,
        },
        {
          estado: EstadoTrackingTecnico.ACTIVA,
          iniciadoEn: T0,
          finalizadoEn: null,
          ultimoHeartbeatEn: T30,
        },
      ]),
    ).toBe(90);
  });

  it('los minutos de jornada solo existen con hora de salida', () => {
    expect(
      calculateAttendanceMinutes({ horaEntrada: T0, horaSalida: null }),
    ).toBeNull();
    expect(
      calculateAttendanceMinutes({ horaEntrada: T0, horaSalida: T60 }),
    ).toBe(60);
    expect(
      calculateAttendanceMinutes({ horaEntrada: T60, horaSalida: T0 }),
    ).toBe(0);
  });

  it('los minutos sin tracking nunca son negativos y dependen de la jornada', () => {
    expect(
      calculateMinutesWithoutTracking({
        minutosJornada: null,
        minutosTracking: 5,
      }),
    ).toBeNull();
    expect(
      calculateMinutesWithoutTracking({
        minutosJornada: 60,
        minutosTracking: 45,
      }),
    ).toBe(15);
    expect(
      calculateMinutesWithoutTracking({
        minutosJornada: 30,
        minutosTracking: 45,
      }),
    ).toBe(0);
  });

  it('minutosEntre redondea hacia abajo y no baja de cero', () => {
    expect(minutosEntre(T0, T30)).toBe(30);
    expect(minutosEntre(T60, T0)).toBe(0);
  });
});
