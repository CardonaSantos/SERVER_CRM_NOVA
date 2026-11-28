import { TrackingDatosInvalidosError } from '../errors/real-time-location.errors';
import {
  claveExpiracionTracking,
  getTrackingBusinessDate,
} from './fecha-laboral-tracking.policy';

describe('getTrackingBusinessDate', () => {
  it('devuelve el día de Guatemala como medianoche UTC', () => {
    // 15:00 UTC = 09:00 en Guatemala (UTC-6): mismo día.
    expect(
      getTrackingBusinessDate(new Date('2026-11-25T15:00:00.000Z')),
    ).toEqual(new Date('2026-11-25T00:00:00.000Z'));
  });

  it('a las 23:30 de Guatemala ya es el día siguiente en UTC pero sigue siendo el mismo día laboral', () => {
    // 2026-11-26T05:30Z = 2026-11-25 23:30 en Guatemala.
    expect(
      getTrackingBusinessDate(new Date('2026-11-26T05:30:00.000Z')),
    ).toEqual(new Date('2026-11-25T00:00:00.000Z'));
  });

  it('justo después de la medianoche de Guatemala cambia de día', () => {
    // 2026-11-26T06:00Z = 2026-11-26 00:00 en Guatemala.
    expect(
      getTrackingBusinessDate(new Date('2026-11-26T06:00:00.000Z')),
    ).toEqual(new Date('2026-11-26T00:00:00.000Z'));
  });

  it('rechaza un instante inválido', () => {
    expect(() => getTrackingBusinessDate(new Date('x'))).toThrow(
      TrackingDatosInvalidosError,
    );
  });
});

describe('claveExpiracionTracking', () => {
  it('usa la fecha y la hora de Guatemala', () => {
    // 15:45 UTC = 09:45 en Guatemala.
    expect(claveExpiracionTracking(new Date('2026-11-25T15:45:00.000Z'))).toBe(
      'TRACKING_EXPIRACION:2026-11-25T09:45',
    );
  });

  it('a las 23:45 de Guatemala sigue siendo el mismo día', () => {
    expect(claveExpiracionTracking(new Date('2026-11-26T05:45:30.000Z'))).toBe(
      'TRACKING_EXPIRACION:2026-11-25T23:45',
    );
  });

  it('un retraso de unos segundos o minutos no cambia la clave', () => {
    expect(claveExpiracionTracking(new Date('2026-11-25T15:47:10.000Z'))).toBe(
      'TRACKING_EXPIRACION:2026-11-25T09:45',
    );
  });

  it('rechaza un instante inválido', () => {
    expect(() => claveExpiracionTracking(new Date('x'))).toThrow(
      TrackingDatosInvalidosError,
    );
  });
});
