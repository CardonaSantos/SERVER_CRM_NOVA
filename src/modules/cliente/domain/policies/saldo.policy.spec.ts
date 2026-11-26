import { calcularSaldo } from './saldo.policy';

const dia = (n: number) => new Date(Date.UTC(2026, 10, n));
const pago = (montoPagado: number, n: number) => ({
  montoPagado,
  fechaPago: dia(n),
});

describe('calcularSaldo', () => {
  it('suma lo que falta de las facturas con deuda', () => {
    const saldo = calcularSaldo([
      { estado: 'PENDIENTE', monto: 150, pagos: [] },
      { estado: 'PARCIAL', monto: 150, pagos: [pago(100.1, 3)] },
      { estado: 'VENCIDA', monto: 100, pagos: [] },
      { estado: 'PAGADA', monto: 200, pagos: [pago(200, 20)] },
      { estado: 'ANULADA', monto: 500, pagos: [] },
    ]);

    expect(saldo).toEqual({
      saldoPendiente: 299.9,
      totalPagado: 200,
      ultimoPago: dia(20),
    });
  });

  it('un pago de más no resta a otras facturas', () => {
    const saldo = calcularSaldo([
      { estado: 'PARCIAL', monto: 100, pagos: [pago(130, 1)] },
      { estado: 'PENDIENTE', monto: 50, pagos: [] },
    ]);

    expect(saldo.saldoPendiente).toBe(50);
  });

  it('sin facturas no debe nada', () => {
    expect(calcularSaldo([])).toEqual({
      saldoPendiente: 0,
      totalPagado: 0,
      ultimoPago: null,
    });
  });
});
