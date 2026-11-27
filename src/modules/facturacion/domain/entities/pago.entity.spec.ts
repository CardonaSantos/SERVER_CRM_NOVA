import { MetodoPago } from '../enums/metodo-pago.enum';
import { OrigenPago } from '../enums/origen-pago.enum';
import {
  PagoBoletaRequeridaError,
  PagoInvalidoError,
} from '../errors/facturacion.errors';
import { claveNumeroBoleta } from '../policies/numero-boleta.policy';
import { PagoEntity } from './pago.entity';

const AHORA = new Date('2026-11-26T18:00:00Z');
const base = {
  facturaId: 1,
  clienteId: 7,
  montoPagado: 50,
  metodoPago: MetodoPago.EFECTIVO,
  fechaPago: AHORA,
  cobradorId: 4,
  origen: OrigenPago.OFICINA,
};

describe('PagoEntity', () => {
  it('en efectivo no guarda número', () => {
    const pago = PagoEntity.registrar(
      { ...base, numeroBoleta: '123' },
      AHORA,
    ).toPrimitives();

    expect(pago).toMatchObject({
      id: null,
      numeroBoleta: null,
      rutaId: null,
      codigoConfirmacion: null,
      creadoEn: AHORA,
    });
  });

  it('por depósito guarda el número sin espacios en los extremos', () => {
    const pago = PagoEntity.registrar(
      { ...base, metodoPago: MetodoPago.DEPOSITO, numeroBoleta: '  AB 12 ' },
      AHORA,
    );

    expect(pago.numeroBoleta).toBe('AB 12');
  });

  it.each([undefined, null, '', '   '])(
    'por depósito exige número (%p)',
    (numeroBoleta) => {
      expect(() =>
        PagoEntity.registrar(
          { ...base, metodoPago: MetodoPago.DEPOSITO, numeroBoleta },
          AHORA,
        ),
      ).toThrow(PagoBoletaRequeridaError);
    },
  );

  it.each([0, -1, 0.001])('rechaza el monto %p', (montoPagado) => {
    expect(() => PagoEntity.registrar({ ...base, montoPagado }, AHORA)).toThrow(
      PagoInvalidoError,
    );
  });

  it('el mismo número con otros espacios o mayúsculas es el mismo', () => {
    expect(claveNumeroBoleta('AB 12-x')).toBe(claveNumeroBoleta(' ab12-X'));
    expect(claveNumeroBoleta('AB12')).not.toBe(claveNumeroBoleta('AB-12'));
  });
});
