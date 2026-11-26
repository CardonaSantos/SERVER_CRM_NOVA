import { TrackingDatosInvalidosError } from '../errors/real-time-location.errors';
import { getTrackingBusinessDate } from './fecha-laboral-tracking.policy';

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
