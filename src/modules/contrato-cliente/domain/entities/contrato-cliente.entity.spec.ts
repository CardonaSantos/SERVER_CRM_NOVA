import { ContratoDatosInvalidosError } from '../errors/contrato-cliente.errors';
import { ContratoClienteEntity } from './contrato-cliente.entity';

const AHORA = new Date('2026-11-27T18:00:00.000Z');

describe('ContratoClienteEntity', () => {
  it('lo que no llega queda vacío, sin NaN', () => {
    expect(
      ContratoClienteEntity.create(
        { clienteId: 7, observaciones: '  ' },
        AHORA,
      ).toPrimitives(),
    ).toMatchObject({
      id: null,
      clienteId: 7,
      costoInstalacion: null,
      fechaPago: null,
      fechaInstalacionProgramada: null,
      observaciones: null,
    });
  });

  it('admite costo cero', () => {
    const contrato = ContratoClienteEntity.create(
      { clienteId: 7, costoInstalacion: 0 },
      AHORA,
    );

    expect(contrato.toPrimitives().costoInstalacion).toBe(0);
  });

  it.each([
    { clienteId: 0 },
    { clienteId: 7, costoInstalacion: -1 },
    { clienteId: 7, costoInstalacion: Number.NaN },
    { clienteId: 7, fechaPago: '2026-11-27T00:00:00Z' },
  ])('rechaza %o', (input) => {
    expect(() => ContratoClienteEntity.create(input, AHORA)).toThrow(
      ContratoDatosInvalidosError,
    );
  });
});
