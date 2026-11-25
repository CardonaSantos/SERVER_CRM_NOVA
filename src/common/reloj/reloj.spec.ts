import {
  esFechaNegocioValida,
  fechaNegocioDe,
  inicioDiaNegocio,
  rangoDiasNegocio,
} from './fecha-negocio';
import { RelojFijo } from './reloj-fijo';
import { RelojSistemaAdapter } from './reloj-sistema.adapter';

describe('reloj y fechas de negocio (America/Guatemala, UTC-6)', () => {
  it('la fecha operativa cambia a medianoche de Guatemala, no de UTC', () => {
    // 23:30 en Guatemala = 05:30 UTC del día siguiente.
    expect(fechaNegocioDe(new Date('2026-11-25T05:30:00Z'))).toBe('2026-11-24');
    // 00:30 en Guatemala.
    expect(fechaNegocioDe(new Date('2026-11-25T06:30:00Z'))).toBe('2026-11-25');
  });

  it('inicioDiaNegocio es las 00:00 de Guatemala (06:00 UTC)', () => {
    expect(inicioDiaNegocio('2026-11-24').toISOString()).toBe(
      '2026-11-24T06:00:00.000Z',
    );
  });

  it('rangoDiasNegocio cubre días completos [desde, hasta + 1)', () => {
    const rango = rangoDiasNegocio('2026-11-01', '2026-11-30');

    expect(rango.gte!.toISOString()).toBe('2026-11-01T06:00:00.000Z');
    expect(rango.lt!.toISOString()).toBe('2026-12-01T06:00:00.000Z');
    expect(rangoDiasNegocio()).toEqual({});
    expect(rangoDiasNegocio(null, '2026-12-31').lt!.toISOString()).toBe(
      '2027-01-01T06:00:00.000Z',
    );
  });

  it('rechaza fechas que no existen o con otro formato', () => {
    expect(esFechaNegocioValida('2026-02-28')).toBe(true);
    expect(esFechaNegocioValida('2028-02-29')).toBe(true);
    expect(esFechaNegocioValida('2026-02-30')).toBe(false);
    expect(esFechaNegocioValida('2026-13-01')).toBe(false);
    expect(esFechaNegocioValida('24/11/2026')).toBe(false);
    expect(esFechaNegocioValida(20261124)).toBe(false);
    expect(() => inicioDiaNegocio('2026-02-30')).toThrow(RangeError);
    expect(() => rangoDiasNegocio(null, 'ayer')).toThrow(RangeError);
  });

  it('RelojFijo es controlable y devuelve copias', () => {
    const reloj = new RelojFijo('2026-11-24T16:00:00Z');

    const a = reloj.ahora();
    a.setFullYear(2000);
    expect(reloj.ahora().toISOString()).toBe('2026-11-24T16:00:00.000Z');
    expect(reloj.fechaOperativa()).toBe('2026-11-24');

    reloj.avanzar({ horas: 13, minutos: 59 }); // 23:59 GT del 24
    expect(reloj.fechaOperativa()).toBe('2026-11-24');

    reloj.avanzar({ minutos: 1 }); // 00:00 GT del 25
    expect(reloj.fechaOperativa()).toBe('2026-11-25');

    reloj.establecer('2027-01-01T05:59:00Z');
    expect(reloj.fechaOperativa()).toBe('2026-12-31');
  });

  it('RelojSistemaAdapter da la hora actual y su fecha de negocio', () => {
    const reloj = new RelojSistemaAdapter();
    const antes = Date.now();
    const ahora = reloj.ahora().getTime();

    expect(ahora).toBeGreaterThanOrEqual(antes);
    expect(ahora - antes).toBeLessThan(5_000);
    expect(reloj.fechaOperativa()).toBe(fechaNegocioDe(new Date(ahora)));
  });
});
