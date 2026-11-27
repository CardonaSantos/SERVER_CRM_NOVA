import { FacturaInvalidaError } from '../errors/facturacion.errors';
import {
  detalleDelMes,
  detallePrimeraFactura,
  fechasDelMes,
  fechasPrimeraFactura,
  mesesEntre,
} from './calendario-factura.policy';

describe('calendario de facturas', () => {
  it('vence el día de pago a las 00:00 de Guatemala', () => {
    expect(fechasDelMes({ anio: 2026, mes: 9 }, 10)).toEqual({
      periodo: '202609',
      fechaPagoEsperada: new Date('2026-09-10T06:00:00.000Z'),
    });
  });

  it.each([
    [2026, 2, 31, '2026-02-28T06:00:00.000Z'],
    [2028, 2, 30, '2028-02-29T06:00:00.000Z'],
    [2026, 4, 31, '2026-04-30T06:00:00.000Z'],
    [2026, 12, 31, '2026-12-31T06:00:00.000Z'],
  ])('en %i-%i el día %i cae el último del mes', (anio, mes, dia, fecha) => {
    expect(fechasDelMes({ anio, mes }, dia).fechaPagoEsperada).toEqual(
      new Date(fecha),
    );
  });

  it('el detalle lleva mes, monto y plan', () => {
    expect(
      detalleDelMes({ anio: 2026, mes: 9 }, { nombre: 'Plan 10', precio: 150 }),
    ).toBe('Factura correspondiente a SEPTIEMBRE 2026 por Q150.00 | Plan 10');
    expect(
      detallePrimeraFactura({ nombre: 'Plan 10', velocidad: '10 Mbps' }),
    ).toBe('Pago mensual servicio Plan 10 (10 Mbps)');
  });

  it('la primera factura usa el día de pago dentro del mes del alta', () => {
    const alta = new Date(2026, 10, 26, 15, 30);

    expect(fechasPrimeraFactura(alta, 5)).toEqual({
      periodo: '202611',
      fechaPagoEsperada: new Date(2026, 10, 5, 15, 30),
    });
    // Un día que el mes no tiene pasa al siguiente (comportamiento anterior).
    expect(fechasPrimeraFactura(alta, 31).periodo).toBe('202612');
  });

  it('los meses van de inicio a fin', () => {
    expect(mesesEntre(2026, 10, 12).map((m) => m.mes)).toEqual([10, 11, 12]);
  });

  it.each([
    [2026, 0, 1],
    [2026, 1, 13],
    [2026, 5, 4],
    [1999, 1, 1],
  ])('rechaza %i de %i a %i', (anio, inicio, fin) => {
    expect(() => mesesEntre(anio, inicio, fin)).toThrow(FacturaInvalidaError);
  });
});
