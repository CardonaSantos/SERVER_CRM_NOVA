import {
  FechaAuditoriaInvalidaError,
  RangoFechasAuditoriaInvalidoError,
} from '../../domain/errors/pppoe-auditoria.errors';

import { RangoFechasAuditoriaService } from './rango-fechas-auditoria.service';

describe('RangoFechasAuditoriaService', () => {
  const servicio = new RangoFechasAuditoriaService();

  it('fechas sin hora = días completos en Guatemala (UTC-6)', () => {
    const r = servicio.interpretar('2026-11-01', '2026-11-30');

    expect(r.fechaDesde!.toISOString()).toBe('2026-11-01T06:00:00.000Z');
    expect(r.fechaHasta!.toISOString()).toBe('2026-12-01T05:59:59.999Z');
  });

  it('fechas con hora se usan tal cual; vacías → null', () => {
    expect(servicio.interpretar('2026-11-24T10:00:00Z', ' ')).toEqual({
      fechaDesde: new Date('2026-11-24T10:00:00Z'),
      fechaHasta: null,
    });
    expect(servicio.interpretar()).toEqual({
      fechaDesde: null,
      fechaHasta: null,
    });
  });

  it('rechaza fechas inexistentes y rangos invertidos con errores de dominio', () => {
    expect(() => servicio.interpretar('2026-02-30')).toThrow(
      FechaAuditoriaInvalidaError,
    );
    expect(() => servicio.interpretar(undefined, 'ayer')).toThrow(
      FechaAuditoriaInvalidaError,
    );
    expect(() => servicio.interpretar('2026-11-30', '2026-11-01')).toThrow(
      RangoFechasAuditoriaInvalidoError,
    );
  });
});
