import { FacturaSinPagar } from '../read-models/finanzas.read-model';
import { FotoMensualCarteraReadModel } from '../read-models/evolucion-cartera.read-model';
import {
  cifrasFotoMensual,
  evolucionCartera,
  mesQueCierra,
  mesesCerrados,
} from './foto-mensual.policy';

const clientes = {
  totalEnSistema: 6,
  servicio: {
    activos: 3,
    suspendidos: 1,
    pendientesActivacion: 1,
    enInstalacion: 0,
    desinstalados: 1,
  },
  cobranza: { alDia: 2, pagoPendiente: 1, atrasados: 1, morosos: 1 },
};

const factura = (
  clienteId: number,
  vence: string | null,
  saldo: number,
  extra: Partial<FacturaSinPagar> = {},
): FacturaSinPagar => ({
  clienteId,
  vence,
  pagada: false,
  montoPago: saldo,
  saldoPendiente: saldo,
  clienteDesinstalado: false,
  ...extra,
});

describe('foto mensual', () => {
  it('el día 1 cierra el mes anterior, también en enero', () => {
    expect(mesQueCierra('2027-03-01')).toBe('2027-02');
    expect(mesQueCierra('2027-01-01')).toBe('2026-12');
  });

  it('copia los estados y calcula la deuda con las reglas del panel', () => {
    const facturas = [
      factura(1, '2027-02-28', 100), // vencida el día 1
      factura(1, '2027-03-05', 50), // por vencer
      factura(2, '2027-01-31', 200.25), // vencida
      factura(3, '2027-03-10', 0), // sin saldo: no cuenta
      factura(4, '2027-01-01', 75, { clienteDesinstalado: true }),
    ];

    const r = cifrasFotoMensual('2027-02', clientes, facturas, '2027-03-01');

    expect(r).toEqual({
      mes: '2027-02',
      totalClientes: 6,
      activos: 3,
      suspendidos: 1,
      pendientesActivacion: 1,
      enInstalacion: 0,
      desinstalados: 1,
      alDia: 2,
      pagoPendiente: 1,
      atrasados: 1,
      morosos: 1,
      facturasConDeuda: 3,
      clientesConDeuda: 2,
      clientesConDeudaVencida: 2,
      deuda: 350.25,
      deudaVencida: 300.25,
      deudaDesinstalados: 75,
    });
  });
});

describe('evolución de la cartera', () => {
  it('toma los meses ya cerrados, sin el actual, cruzando el año', () => {
    expect(mesesCerrados('2027-02-15', 3)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
    ]);
    expect(mesesCerrados('2027-03-01', 1)).toEqual(['2027-02']);
  });

  it('una fila por mes; sin foto, cifras en null', () => {
    const foto: FotoMensualCarteraReadModel = {
      mes: '2027-01',
      tomadaEn: new Date('2027-02-01T06:30:00.000Z'),
      totalClientes: 6,
      activos: 3,
      suspendidos: 1,
      pendientesActivacion: 1,
      enInstalacion: 0,
      desinstalados: 1,
      alDia: 2,
      pagoPendiente: 1,
      atrasados: 1,
      morosos: 1,
      facturasConDeuda: 3,
      clientesConDeuda: 2,
      clientesConDeudaVencida: 2,
      deuda: 350.25,
      deudaVencida: 300.25,
      deudaDesinstalados: 75,
    };

    const r = evolucionCartera(['2026-12', '2027-01', '2027-02'], [foto]);

    expect(r.periodo).toEqual({ desde: '2026-12-01', hasta: '2027-02-28' });
    expect(r.meses.map((m) => m.mes)).toEqual([
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
    expect(r.meses[1]).toEqual(foto);
    expect(r.meses[0]).toMatchObject({
      mes: '2026-12',
      tomadaEn: null,
      activos: null,
      deuda: null,
    });
    expect(Object.values(r.meses[2]).filter((v) => v !== null)).toEqual([
      '2027-02',
    ]);
  });
});
