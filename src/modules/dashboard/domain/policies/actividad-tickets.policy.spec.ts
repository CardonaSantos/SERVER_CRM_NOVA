import { PrioridadTicket } from '../../../ticket-soporte/public/ticket-soporte.types';
import { Granularidad } from '../enums/granularidad.enum';
import { PresetActividad } from '../enums/preset-actividad.enum';
import { DashboardRangoInvalidoError } from '../errors/dashboard.errors';
import {
  armarActividad,
  PedidoRango,
  resolverRango,
} from './actividad-tickets.policy';

const HOY = '2026-11-27';

const rango = (preset: PresetActividad, extra: Partial<PedidoRango> = {}) =>
  resolverRango({ preset, hoy: HOY, primerTicket: null, ...extra });

describe('rango de la actividad de tickets', () => {
  it('7 días se compara con los 7 anteriores', () => {
    expect(rango(PresetActividad.ULTIMOS_7_DIAS)).toMatchObject({
      desde: '2026-11-21',
      hastaExclusivo: '2026-11-28',
      granularidad: Granularidad.DIA,
      comparacion: { desde: '2026-11-14', hastaExclusivo: '2026-11-21' },
    });
  });

  it('12 meses va por mes y se compara con el año anterior', () => {
    expect(rango(PresetActividad.ULTIMOS_12_MESES)).toMatchObject({
      desde: '2025-12-01',
      granularidad: Granularidad.MES,
      comparacion: { desde: '2024-12-01', hastaExclusivo: '2025-11-28' },
    });
  });

  it('el histórico agrupa según su largo y no se compara', () => {
    expect(
      rango(PresetActividad.HISTORICO, { primerTicket: '2023-02-10' }),
    ).toMatchObject({
      granularidad: Granularidad.TRIMESTRE,
      comparacion: null,
    });
  });

  it.each([
    { desde: '2026-11-01' },
    { desde: '2026-11-10', hasta: '2026-11-01' },
    { desde: '2026-11-01', hasta: '2026-11-28' },
  ])('rechaza el rango personalizado %o', (extra) => {
    expect(() => rango(PresetActividad.PERSONALIZADO, extra)).toThrow(
      DashboardRangoInvalidoError,
    );
  });
});

describe('armarActividad', () => {
  const apertura = new Date('2026-11-25T14:00:00.000Z');

  it('cuenta el período, compara y mide hasta que terminó el técnico', () => {
    const resultado = armarActividad(
      rango(PresetActividad.ULTIMOS_7_DIAS),
      {
        creados: [
          {
            fecha: '2026-11-25',
            fechaApertura: apertura,
            prioridad: PrioridadTicket.ALTA,
          },
          {
            fecha: '2026-11-15',
            fechaApertura: apertura,
            prioridad: PrioridadTicket.BAJA,
          },
        ],
        resueltos: [
          {
            fecha: '2026-11-27',
            prioridad: PrioridadTicket.ALTA,
            fechaApertura: apertura,
            fechaInicioAtencion: null,
            finTrabajo: new Date('2026-11-25T15:30:00.000Z'),
          },
        ],
        pendientes: [
          {
            prioridad: PrioridadTicket.URGENTE,
            fechaApertura: new Date('2026-11-01T00:00:00.000Z'),
          },
        ],
      },
      new Date('2026-11-25T00:00:00.000Z'),
    );

    expect(resultado.resumen).toEqual({
      creados: 1,
      resueltos: 1,
      pendientesActuales: 1,
      urgentesPendientes: 1,
      altosPendientes: 0,
      pendientesMas48Horas: 1,
    });
    expect(resultado.tiempos).toEqual({
      promedioResolucionMinutos: 90,
      promedioPrimeraAtencionMinutos: null,
    });
    expect(resultado.comparativa?.creados).toEqual({
      actual: 1,
      anterior: 1,
      variacionPorcentaje: 0,
    });
    expect(resultado.comparativa?.resueltos.variacionPorcentaje).toBeNull();
    expect(resultado.periodo.puntos).toBe(7);
    expect(resultado.actividad[4]).toMatchObject({
      periodo: '2026-11-25',
      creados: 1,
      resueltos: 0,
    });
    expect(resultado.actividad[6].prioridades.resueltos.ALTA).toBe(1);
  });

  it('agrupa por trimestre desde el inicio del trimestre', () => {
    const resultado = armarActividad(
      rango(PresetActividad.HISTORICO, { primerTicket: '2024-05-20' }),
      { creados: [], resueltos: [], pendientes: [] },
      apertura,
    );

    expect(resultado.actividad[0].periodo).toBe('2024-Q2');
    expect(resultado.actividad[resultado.actividad.length - 1].periodo).toBe(
      '2026-Q4',
    );
  });
});
