import { calcularTotalesRuta, saldoDeFactura } from './totales-ruta.policy';

describe('totales de una ruta de cobro', () => {
  it('el saldo de una factura sale de sus pagos y nunca es negativo', () => {
    expect(saldoDeFactura(150, [])).toBe(150);
    expect(saldoDeFactura(150, [100.1, 0.2])).toBe(49.7);
    expect(saldoDeFactura(100, [130])).toBe(0);
  });

  it('lo cobrado sale de los pagos aunque la factura ya esté pagada', () => {
    const totales = calcularTotalesRuta({
      // El cliente 1 pagó todo; el 2 abonó; el 3 no ha pagado.
      saldosPorCliente: [[], [49.7, 100], [0.1, 0.2]],
      cobros: [
        { clienteId: 1, monto: 200 },
        { clienteId: 2, monto: 100.3 },
      ],
    });

    expect(totales).toEqual({
      clientes: 3,
      clientesCobrados: 2,
      facturasPendientes: 4,
      porCobrar: 150,
      cobrado: 300.3,
    });
  });

  it('una ruta vacía queda en cero', () => {
    expect(calcularTotalesRuta({ saldosPorCliente: [], cobros: [] })).toEqual({
      clientes: 0,
      clientesCobrados: 0,
      facturasPendientes: 0,
      porCobrar: 0,
      cobrado: 0,
    });
  });
});
