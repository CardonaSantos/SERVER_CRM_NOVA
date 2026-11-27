import { productividadDelMes } from './panel-tecnico.policy';

const hora = (h: number) => new Date(Date.UTC(2026, 10, 2, h));

describe('productividadDelMes', () => {
  it('cuenta por día, promedia y elige los días extremos', () => {
    const r = productividadDelMes(
      '2026-11-03',
      [
        { fecha: '2026-11-02', inicio: hora(10), fin: hora(11) },
        { fecha: '2026-11-02', inicio: hora(10), fin: null },
      ],
      [
        {
          fecha: '2026-11-03',
          minutosRegistrados: 45,
          inicio: null,
          fin: hora(12),
        },
      ],
    );

    expect(r.productividadMes).toMatchObject({
      ticketsResueltos: 2,
      instalacionesCompletadas: 1,
      trabajosCompletados: 3,
      diasConActividad: 2,
      promedioTicketsPorDia: 0.67,
      promedioTrabajosPorDiaActivo: 1.5,
    });
    expect(r.tiempos).toEqual({
      promedioResolucionTicketMinutos: 60,
      promedioInstalacionMinutos: 45,
    });
    expect(r.actividadDiaria.map((d) => d.total)).toEqual([0, 2, 1]);
    expect(r.actividadDiaria[1].etiqueta).toBe('lun 2');
    expect(r.resumenActividad.diaMasProductivo?.fecha).toBe('2026-11-02');
    expect(r.resumenActividad.diaMenosProductivoConActividad?.fecha).toBe(
      '2026-11-03',
    );
  });

  it('sin actividad no inventa promedios', () => {
    const r = productividadDelMes('2026-11-01', [], []);

    expect(r.tiempos.promedioResolucionTicketMinutos).toBeNull();
    expect(r.resumenActividad.diaMasProductivo).toBeNull();
    expect(r.productividadMes.promedioTrabajosPorDiaActivo).toBe(0);
  });
});
