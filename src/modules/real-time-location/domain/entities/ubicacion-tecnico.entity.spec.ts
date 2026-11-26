import { TrackingDatosInvalidosError } from '../errors/real-time-location.errors';
import { UbicacionTecnicoEntity } from './ubicacion-tecnico.entity';

const CAPTURADO = new Date('2026-11-25T14:05:00.000Z');

const base = {
  tecnicoId: 7,
  sesionTrackingId: 1,
  latitud: 14.6349,
  longitud: -90.5069,
  precision: 5,
  velocidad: 0,
  bateria: 80,
  capturadoEn: CAPTURADO,
};

describe('UbicacionTecnicoEntity', () => {
  it('nace con la fecha de captura del dispositivo y sin fechas de servidor', () => {
    const ubicacion = UbicacionTecnicoEntity.create(base);

    expect(ubicacion.capturadoEn).toEqual(CAPTURADO);
    expect(ubicacion.creadoEn).toBeUndefined();
    expect(ubicacion.isPersisted).toBe(false);
    expect(ubicacion.latitud).toBe(14.6349);
  });

  it('precisión, velocidad y batería son opcionales', () => {
    const ubicacion = UbicacionTecnicoEntity.create({
      tecnicoId: 7,
      sesionTrackingId: 1,
      latitud: 0,
      longitud: 0,
      capturadoEn: CAPTURADO,
    });

    expect(ubicacion.precision).toBeNull();
    expect(ubicacion.velocidad).toBeNull();
    expect(ubicacion.bateria).toBeNull();
  });

  it.each([
    ['latitud', { latitud: 91 }],
    ['latitud', { latitud: Number.NaN }],
    ['longitud', { longitud: -181 }],
    ['precisión', { precision: -1 }],
    ['velocidad', { velocidad: -0.1 }],
    ['batería', { bateria: 101 }],
    ['batería', { bateria: 50.5 }],
    ['técnico', { tecnicoId: 0 }],
    ['sesión', { sesionTrackingId: 0 }],
    ['captura', { capturadoEn: new Date('x') }],
  ])('rechaza %s inválida', (_nombre, cambio) => {
    expect(() => UbicacionTecnicoEntity.create({ ...base, ...cambio })).toThrow(
      TrackingDatosInvalidosError,
    );
  });

  it('acepta los extremos válidos', () => {
    expect(() =>
      UbicacionTecnicoEntity.create({
        ...base,
        latitud: -90,
        longitud: 180,
        bateria: 0,
      }),
    ).not.toThrow();
  });
});
