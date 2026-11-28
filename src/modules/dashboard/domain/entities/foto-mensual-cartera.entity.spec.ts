import { FotoMensualInvalidaError } from '../errors/dashboard.errors';
import { TomarFotoMensualProps } from '../props/foto-mensual-cartera.props';
import { FotoMensualCarteraEntity } from './foto-mensual-cartera.entity';

const AHORA = new Date('2027-03-01T06:30:00.000Z');

const cifras: TomarFotoMensualProps = {
  mes: '2027-02',
  totalClientes: 10,
  activos: 7,
  suspendidos: 1,
  pendientesActivacion: 1,
  enInstalacion: 0,
  desinstalados: 1,
  alDia: 5,
  pagoPendiente: 2,
  atrasados: 1,
  morosos: 1,
  facturasConDeuda: 6,
  clientesConDeuda: 4,
  clientesConDeudaVencida: 2,
  deuda: 900,
  deudaVencida: 300.5,
  deudaDesinstalados: 150,
};

describe('FotoMensualCarteraEntity', () => {
  it('se toma con la hora de quien la toma y devuelve copias', () => {
    const foto = FotoMensualCarteraEntity.tomar(cifras, AHORA);
    const p = foto.toPrimitives();

    expect(p).toEqual({ ...cifras, id: null, tomadaEn: AHORA });
    p.tomadaEn.setFullYear(2000);
    expect(foto.toPrimitives().tomadaEn).toEqual(AHORA);
  });

  it('se reconstruye desde la base', () => {
    const foto = FotoMensualCarteraEntity.hydrate({
      ...cifras,
      id: 3,
      tomadaEn: AHORA,
    });
    expect(foto.mes).toBe('2027-02');
  });

  it.each([
    { mes: '2027-13' },
    { mes: '2027-2' },
    { activos: -1 },
    { morosos: 1.5 },
    { deuda: -1 },
    { deudaVencida: Number.NaN },
    { deudaVencida: 901 },
  ])('rechaza cifras imposibles: %o', (cambio) => {
    expect(() =>
      FotoMensualCarteraEntity.tomar({ ...cifras, ...cambio }, AHORA),
    ).toThrow(FotoMensualInvalidaError);
  });
});
