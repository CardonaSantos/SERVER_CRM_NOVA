import { EjecucionTareaInvalidaError } from '../errors/tareas-programadas.errors';
import { restarDias } from './retencion.policy';

describe('restarDias', () => {
  it('cruza meses, años y febrero bisiesto', () => {
    expect(restarDias('2027-03-06', 0)).toBe('2027-03-06');
    expect(restarDias('2027-03-06', 6)).toBe('2027-02-28');
    expect(restarDias('2028-03-01', 1)).toBe('2028-02-29');
    expect(restarDias('2027-01-15', 180)).toBe('2026-07-19');
  });

  it('rechaza fechas o días inválidos', () => {
    expect(() => restarDias('06/03/2027', 1)).toThrow(
      EjecucionTareaInvalidaError,
    );
    expect(() => restarDias('2027-03-06', -1)).toThrow(
      EjecucionTareaInvalidaError,
    );
  });
});
