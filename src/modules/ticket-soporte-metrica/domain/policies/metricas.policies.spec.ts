import { EstadoMetaTicket } from '../enums/estado-meta-ticket.enum';
import { MetaTicketReadModel } from '../read-models/meta-ticket.read-model';
import { calcularAvance } from './avance-meta.policy';
import {
  diasEntre,
  diasTranscurridos,
  fechasEntre,
  periodoDeMes,
} from './fechas.policy';

const meta: MetaTicketReadModel = {
  id: 1,
  titulo: null,
  tecnico: { id: 1, nombre: 'Ana', activo: true },
  fechaInicio: '2026-07-01',
  fechaFin: '2026-07-10',
  objetivo: 2,
  cancelada: false,
  creadoEn: new Date('2026-07-01T00:00:00.000Z'),
  actualizadoEn: new Date('2026-07-01T00:00:00.000Z'),
};

const cierre = (id: number, diaCierre: string, tecnicoIds = [1]) => ({
  id,
  tecnicoIds,
  diaCierre,
});

describe('fechas de negocio', () => {
  it('cuenta ambos extremos y no da negativos', () => {
    expect(diasEntre('2026-07-01', '2026-07-31')).toBe(31);
    expect(diasEntre('2026-07-02', '2026-07-01')).toBe(0);
    expect(diasTranscurridos('2026-07-01', '2026-07-31', '2026-06-20')).toBe(0);
    expect(diasTranscurridos('2026-07-01', '2026-07-31', '2026-07-10')).toBe(
      10,
    );
    expect(diasTranscurridos('2026-07-01', '2026-07-31', '2026-09-01')).toBe(
      31,
    );
  });

  it('arma el periodo de un mes, también en año bisiesto', () => {
    expect(periodoDeMes('2028-02')).toEqual({
      desde: '2028-02-01',
      hasta: '2028-02-29',
    });
    expect(periodoDeMes('2026-12').hasta).toBe('2026-12-31');
    expect(fechasEntre('2026-07-30', '2026-08-01')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ]);
  });
});

describe('calcularAvance', () => {
  it('cuenta solo sus tickets cerrados dentro de las fechas', () => {
    const resultado = calcularAvance(
      meta,
      [
        cierre(1, '2026-06-30'),
        cierre(2, '2026-07-01'),
        cierre(3, '2026-07-10', [2, 1]),
        cierre(4, '2026-07-11'),
        cierre(5, '2026-07-05', [2]),
      ],
      '2026-07-05',
    );

    expect(resultado).toMatchObject({
      avance: 2,
      faltantes: 0,
      porcentaje: 100,
      estado: EstadoMetaTicket.CUMPLIDA,
      diasTotales: 10,
      diasTranscurridos: 5,
      proyeccion: 4,
    });
  });

  it.each([
    ['2026-06-30', EstadoMetaTicket.PROGRAMADA],
    ['2026-07-10', EstadoMetaTicket.EN_CURSO],
    ['2026-07-11', EstadoMetaTicket.NO_CUMPLIDA],
  ])('sin llegar al objetivo, el %s está %s', (hoy, estado) => {
    expect(calcularAvance(meta, [cierre(1, '2026-07-02')], hoy).estado).toBe(
      estado,
    );
  });

  it('cancelada manda sobre el avance', () => {
    const resultado = calcularAvance(
      { ...meta, cancelada: true },
      [cierre(1, '2026-07-02'), cierre(2, '2026-07-03')],
      '2026-07-20',
    );

    expect(resultado.estado).toBe(EstadoMetaTicket.CANCELADA);
  });
});
