import { sumarMeses } from './calendario.policy';
import { actividadDelMes, actividadHistorica } from './instalaciones.policy';

describe('series de instalaciones', () => {
  it('el mes en curso llega solo hasta hoy', () => {
    const mes = actividadDelMes('2026-11-03', {
      instalaciones: ['2026-11-01', '2026-11-01', '2026-11-03'],
      desinstalaciones: ['2026-11-02'],
    });

    expect(mes.periodo).toEqual({ desde: '2026-11-01', hasta: '2026-11-03' });
    expect(mes.totales).toEqual({
      instalaciones: 3,
      desinstalaciones: 1,
      balance: 2,
    });
    expect(mes.actividadDiaria).toEqual([
      { fecha: '2026-11-01', instalaciones: 2, desinstalaciones: 0 },
      { fecha: '2026-11-02', instalaciones: 0, desinstalaciones: 1 },
      { fecha: '2026-11-03', instalaciones: 1, desinstalaciones: 0 },
    ]);
  });

  it('el histórico son doce meses con ceros donde no hubo nada', () => {
    const anio = actividadHistorica('2026-11-27', {
      instalaciones: ['2025-12-31', '2026-11-01'],
      desinstalaciones: [],
    });

    expect(anio.periodo.desde).toBe('2025-12-01');
    expect(anio.actividadMensual).toHaveLength(12);
    expect(anio.actividadMensual[0]).toMatchObject({
      mes: '2025-12',
      instalaciones: 1,
    });
    expect(anio.actividadMensual[11]).toMatchObject({
      mes: '2026-11',
      instalaciones: 1,
    });
    expect(anio.totales.promedioInstalacionesMes).toBe(0.17);
  });

  it('restar meses no se desborda al mes siguiente', () => {
    expect(sumarMeses('2026-03-31', -1)).toBe('2026-02-28');
    expect(sumarMeses('2028-02-29', -12)).toBe('2027-02-28');
    expect(sumarMeses('2026-01-15', -2)).toBe('2025-11-15');
  });
});
