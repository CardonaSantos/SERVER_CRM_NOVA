import { AgrupacionUbicacion } from '../enums/agrupacion-ubicacion.enum';
import { TramoDeuda } from '../enums/tramo-deuda.enum';
import { FacturaSinPagar } from '../read-models/finanzas.read-model';
import { clientesPorPlan, clientesPorUbicacion } from './cartera.policy';
import { deudaPorAntiguedad, tramoDe } from './deuda.policy';
import {
  cobradoPorMetodo,
  facturacionMensual,
  ultimosMeses,
} from './facturacion-mensual.policy';

const HOY = '2026-11-27';

const deuda = (
  clienteId: number,
  vence: string | null,
  saldo: number,
  desinstalado = false,
): FacturaSinPagar => ({
  clienteId,
  vence,
  clienteDesinstalado: desinstalado,
  pagada: false,
  montoPago: saldo,
  saldoPendiente: saldo,
});

describe('deuda por antigüedad', () => {
  it.each([
    ['2026-11-27', TramoDeuda.POR_VENCER],
    ['2026-11-26', TramoDeuda.DE_1_A_30],
    ['2026-10-28', TramoDeuda.DE_1_A_30],
    ['2026-10-27', TramoDeuda.DE_31_A_60],
    ['2026-09-27', TramoDeuda.DE_61_A_90],
    ['2026-08-28', TramoDeuda.MAS_DE_90],
    [null, TramoDeuda.SIN_FECHA],
  ])('lo que vence el %s va en %s', (vence, tramo) => {
    expect(tramoDe(vence, HOY)).toBe(tramo);
  });

  it('cuenta clientes una vez y aparta a los desinstalados', () => {
    const r = deudaPorAntiguedad(
      [
        deuda(1, '2026-11-01', 100),
        deuda(1, '2026-11-05', 50.5),
        deuda(2, '2026-12-05', 200),
        deuda(3, '2026-01-05', 999, true),
        { ...deuda(4, '2026-11-01', 80), saldoPendiente: null },
        deuda(5, '2026-01-05', 0),
      ],
      HOY,
    );

    expect(r.tramos).toHaveLength(5);
    expect(r.tramos[1]).toMatchObject({
      nombre: '1 a 30 días',
      facturas: 3,
      clientes: 2,
      monto: 230.5,
    });
    expect(r.totales).toEqual({
      facturas: 4,
      clientes: 3,
      monto: 430.5,
      vencido: 230.5,
    });
    expect(r.desinstalados).toEqual({ facturas: 1, clientes: 1, monto: 999 });
  });
});

describe('facturación y cobros por mes', () => {
  const meses = ultimosMeses(HOY, 3);
  const pagos = [
    { mes: '2026-09', metodo: 'EFECTIVO', monto: 100 },
    { mes: '2026-11', metodo: 'DEPOSITO', monto: 300 },
    { mes: '2026-08', metodo: 'TARJETA', monto: 50 },
  ];

  it('separa lo pagado de la factura de lo cobrado en el mes', () => {
    expect(meses).toEqual(['2026-09', '2026-10', '2026-11']);

    const r = facturacionMensual(
      HOY,
      meses,
      [
        { mes: '2026-09', pagada: true, montoPago: 150, saldoPendiente: 0 },
        { mes: '2026-09', pagada: false, montoPago: 150, saldoPendiente: 40 },
      ],
      pagos,
    );

    expect(r.meses[0]).toEqual({
      mes: '2026-09',
      facturas: 2,
      facturado: 300,
      pagado: 260,
      pendiente: 40,
      cobrado: 100,
      pagos: 1,
    });
    expect(r.meses[1]).toMatchObject({ facturado: 0, cobrado: 0 });
    expect(r.totales).toMatchObject({ facturado: 300, cobrado: 400 });
  });

  it('una columna por método usado, con ceros donde no hubo', () => {
    const r = cobradoPorMetodo(HOY, meses, pagos);

    expect(r.metodos.map((m) => m.metodo)).toEqual(['DEPOSITO', 'EFECTIVO']);
    expect(r.meses).toEqual([
      { mes: '2026-09', DEPOSITO: 0, EFECTIVO: 100 },
      { mes: '2026-10', DEPOSITO: 0, EFECTIVO: 0 },
      { mes: '2026-11', DEPOSITO: 300, EFECTIVO: 0 },
    ]);
    expect(r.totales).toEqual({ pagos: 2, monto: 400 });
  });
});

describe('cartera', () => {
  const plan = { id: 1, nombre: 'Hogar', precio: 150 };
  const activo = {
    activo: true,
    tieneZona: true,
    tieneFechaDesinstalacion: false,
    plan,
  };

  it('solo suma ingreso de los que se facturan', () => {
    const r = clientesPorPlan([
      activo,
      { ...activo, activo: false },
      { ...activo, plan: null },
      { ...activo, tieneZona: false },
      { ...activo, tieneFechaDesinstalacion: true },
      { ...activo, plan: { id: 2, nombre: 'Hogar', precio: 250 } },
    ]);

    expect(r.planes.map((p) => p.nombre)).toEqual(['Hogar (2)', 'Hogar (1)']);
    expect(r.planes[1]).toMatchObject({
      clientesFacturables: 1,
      clientesSuspendidos: 1,
      ingresoMensualEsperado: 150,
    });
    expect(r.activosSinFacturar).toEqual({
      sinPlan: 1,
      sinZona: 1,
      conFechaDeDesinstalacion: 1,
    });
    expect(r.totales.ingresoMensualEsperado).toBe(400);
  });

  it('agrupa clientes y deuda, también sin ubicación', () => {
    const r = clientesPorUbicacion(
      AgrupacionUbicacion.SECTOR,
      HOY,
      [
        { id: 1, grupo: { id: 7, nombre: 'Centro' } },
        { id: 2, grupo: { id: 7, nombre: 'Centro' } },
        { id: 3, grupo: null },
        { id: 4, grupo: { id: 8, nombre: ' ' } },
      ],
      [deuda(1, '2026-11-01', 100), deuda(2, '2026-12-05', 60)],
    );

    expect(r.grupos.map((g) => g.nombre)).toEqual([
      'Centro',
      'Sin sector',
      'Sin nombre (8)',
    ]);
    expect(r.grupos[0]).toMatchObject({
      clientes: 2,
      clientesConDeudaVencida: 1,
      deuda: 160,
      deudaVencida: 100,
    });
    expect(r.totales.clientes).toBe(4);
  });
});
