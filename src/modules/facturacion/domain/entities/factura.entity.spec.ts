import { EstadoFactura } from '../enums/estado-factura.enum';
import {
  FacturaAnuladaError,
  FacturaConPagosError,
  FacturaInvalidaError,
  FacturaMontoMenorQuePagadoError,
  FacturaSinDeudaError,
  PagoExcedeSaldoError,
  PagoInvalidoError,
  PagoNoEncontradoError,
} from '../errors/facturacion.errors';
import { FacturaProps, PagoAplicado } from '../props/factura.props';
import { FacturaEntity } from './factura.entity';

const AHORA = new Date('2026-11-26T18:00:00Z');
const AYER = new Date('2026-11-25T18:00:00Z');
const { PENDIENTE, PARCIAL, PAGADA, ANULADA, VENCIDA } = EstadoFactura;

const factura = (
  cambios: Partial<FacturaProps> = {},
  pagos: PagoAplicado[] = [],
) =>
  FacturaEntity.hydrate(
    {
      id: 1,
      empresaId: 1,
      clienteId: 7,
      facturacionZonaId: 2,
      periodo: '202611',
      montoPago: 200,
      saldoPendiente: 200,
      estado: PENDIENTE,
      fechaPagoEsperada: AYER,
      fechaPagada: null,
      detalleFactura: 'Factura',
      nombreClienteFactura: 'Ana',
      creadorId: null,
      creadoEn: AYER,
      actualizadoEn: AYER,
      ...cambios,
    },
    pagos,
  );

const abono = (monto: number, id = 9): PagoAplicado => ({
  id,
  monto,
  fecha: AYER,
});

describe('FacturaEntity', () => {
  it('nace pendiente con todo el monto por pagar', () => {
    const nueva = FacturaEntity.emitir(
      {
        empresaId: 1,
        clienteId: 7,
        facturacionZonaId: 2,
        periodo: '202612',
        montoPago: 150.5,
        fechaPagoEsperada: AHORA,
        detalleFactura: 'x',
        nombreClienteFactura: 'Ana',
      },
      AHORA,
    );

    expect(nueva.toPrimitives()).toMatchObject({
      id: null,
      estado: PENDIENTE,
      saldoPendiente: 150.5,
      fechaPagada: null,
      creadorId: null,
    });
  });

  it.each([-1, Number.NaN, 10.001])('no emite por %p', (montoPago) => {
    expect(() =>
      FacturaEntity.emitir(
        { montoPago } as Parameters<typeof FacturaEntity.emitir>[0],
        AHORA,
      ),
    ).toThrow(FacturaInvalidaError);
  });

  describe('pagos', () => {
    it('un abono la deja parcial y sin fecha pagada', () => {
      const f = factura();

      f.registrarPago(50, AHORA, AHORA);

      expect(f.toPrimitives()).toMatchObject({
        estado: PARCIAL,
        saldoPendiente: 150,
        fechaPagada: null,
      });
    });

    it('al cubrirla queda pagada con la fecha del último pago', () => {
      const f = factura({ estado: PARCIAL }, [abono(0.1), abono(0.2, 10)]);

      f.registrarPago(199.7, AHORA, AHORA);

      expect(f.toPrimitives()).toMatchObject({
        estado: PAGADA,
        saldoPendiente: 0,
        fechaPagada: AHORA,
      });
    });

    it.each([0, -5, 1.999])('rechaza el monto %p', (monto) => {
      expect(() => factura().registrarPago(monto, AHORA, AHORA)).toThrow(
        PagoInvalidoError,
      );
    });

    it('no admite más que el saldo', () => {
      const f = factura({ estado: PARCIAL }, [abono(150)]);

      expect(() => f.registrarPago(50.01, AHORA, AHORA)).toThrow(
        PagoExcedeSaldoError,
      );
    });

    it('no cobra una pagada, aunque no tenga pagos registrados', () => {
      expect(() =>
        factura({ estado: PAGADA }).registrarPago(1, AHORA, AHORA),
      ).toThrow(FacturaSinDeudaError);
      expect(() =>
        factura({}, [abono(200)]).registrarPago(1, AHORA, AHORA),
      ).toThrow(FacturaSinDeudaError);
    });

    it('no cobra una anulada', () => {
      expect(() =>
        factura({ estado: ANULADA }).registrarPago(1, AHORA, AHORA),
      ).toThrow(FacturaAnuladaError);
    });

    it('al quitar un pago vuelve a deber', () => {
      const f = factura({ estado: PAGADA, fechaPagada: AYER }, [
        abono(150),
        abono(50, 10),
      ]);

      f.quitarPago(10, AHORA);
      expect(f.toPrimitives()).toMatchObject({
        estado: PARCIAL,
        saldoPendiente: 50,
        fechaPagada: null,
      });

      f.quitarPago(9, AHORA);
      expect(f.toPrimitives()).toMatchObject({
        estado: PENDIENTE,
        saldoPendiente: 200,
      });
      expect(() => f.quitarPago(9, AHORA)).toThrow(PagoNoEncontradoError);
    });
  });

  describe('edición', () => {
    it('lo que no llega no cambia', () => {
      const f = factura({ estado: VENCIDA });

      f.editar({ detalleFactura: 'Otro' }, AHORA);

      expect(f.toPrimitives()).toMatchObject({
        detalleFactura: 'Otro',
        estado: VENCIDA,
        montoPago: 200,
        fechaPagoEsperada: AYER,
      });
    });

    it('un registro marcado pagado sin pagos no cambia al editar el texto', () => {
      const f = factura({ estado: PAGADA, saldoPendiente: 0 });

      f.editar({ detalleFactura: 'Otro', montoPago: 200 }, AHORA);

      expect(f.estado).toBe(PAGADA);
    });

    it('cambiar el monto recalcula saldo y estado', () => {
      const f = factura({ estado: PARCIAL }, [abono(150)]);

      f.editar({ montoPago: 150 }, AHORA);

      expect(f.toPrimitives()).toMatchObject({
        estado: PAGADA,
        saldoPendiente: 0,
        fechaPagada: AYER,
      });
    });

    it('el monto no puede bajar de lo pagado', () => {
      const f = factura({ estado: PARCIAL }, [abono(150)]);

      expect(() => f.editar({ montoPago: 100 }, AHORA)).toThrow(
        FacturaMontoMenorQuePagadoError,
      );
    });
  });

  describe('anulación', () => {
    it('anula sin deuda y se puede reactivar', () => {
      const f = factura();

      f.anular(AHORA);
      expect(f.toPrimitives()).toMatchObject({
        estado: ANULADA,
        saldoPendiente: 0,
      });
      expect(f.seDebe).toBe(false);
      expect(() => f.editar({ montoPago: 5 }, AHORA)).toThrow(
        FacturaAnuladaError,
      );

      f.reactivar(AHORA);
      expect(f.toPrimitives()).toMatchObject({
        estado: PENDIENTE,
        saldoPendiente: 200,
      });
    });

    it('con pagos no se anula ni se elimina', () => {
      const f = factura({ estado: PARCIAL }, [abono(50)]);

      expect(() => f.anular(AHORA)).toThrow(FacturaConPagosError);
      expect(() => f.asegurarEliminable()).toThrow(FacturaConPagosError);
    });

    it('anular y reactivar son idempotentes', () => {
      const f = factura({ estado: VENCIDA });

      f.reactivar(AHORA);
      expect(f.estado).toBe(VENCIDA);
      f.anular(AHORA);
      f.anular(AHORA);
      expect(f.estado).toBe(ANULADA);
    });
  });
});
