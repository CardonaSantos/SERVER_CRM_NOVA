import {
  diaDeGuatemala,
  fechaParaExcel,
  rangoDeReporte,
} from './fechas-reporte-tickets';

// 23:30 del 26 de noviembre en Guatemala; en UTC ya es 27.
const NOCHE = new Date('2026-11-27T05:30:00.000Z');

describe('fechas del reporte de tickets', () => {
  it('el día es el de Guatemala aunque en UTC ya sea mañana', () => {
    expect(diaDeGuatemala(NOCHE)).toBe('2026-11-26');
    expect(rangoDeReporte({}, NOCHE)?.label).toBe('2026-11-26');
  });

  it('un día va de las 00:00 a las 23:59 de Guatemala', () => {
    const rango = rangoDeReporte({ fecha: '2026-11-26' }, NOCHE)!;

    expect(rango.start.toISOString()).toBe('2026-11-26T06:00:00.000Z');
    expect(rango.end.toISOString()).toBe('2026-11-27T05:59:59.999Z');
  });

  it('un rango incluye completo el último día', () => {
    const rango = rangoDeReporte(
      { fechaInicio: '2026-11-01', fechaFin: '2026-11-26' },
      NOCHE,
    )!;

    expect(rango.label).toBe('2026-11-01 al 2026-11-26');
    expect(rango.end.getTime()).toBeGreaterThan(NOCHE.getTime());
  });

  it('rechaza lo que no es una fecha', () => {
    expect(rangoDeReporte({ fecha: 'ayer' }, NOCHE)).toBeNull();
  });

  it('en Excel se lee la hora de Guatemala', () => {
    expect(fechaParaExcel(NOCHE)?.toISOString()).toBe(
      '2026-11-26T23:30:00.000Z',
    );
    expect(fechaParaExcel(null)).toBeNull();
  });
});
