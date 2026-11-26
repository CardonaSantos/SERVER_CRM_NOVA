import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';

import { DeleteFacturaDto } from './delete-one-factura.dto';

const validar = (body: unknown) =>
  new ValidacionGlobalPipe().transform(body, {
    type: 'body',
    metatype: DeleteFacturaDto,
  });

describe('DeleteFacturaDto con el pipe estricto', () => {
  /** Lo que envía hoy el perfil del cliente en el front React. */
  const payloadDelFront = {
    facturaId: 10,
    estadoFactura: 'PENDIENTE',
    userId: 4,
    fechaEmision: '2026-11-01T06:00:00.000Z',
    fechaVencimiento: '2026-11-10T06:00:00.000Z',
    motivo: 'Duplicada',
  };

  it('acepta el payload del front', async () => {
    await expect(validar(payloadDelFront)).resolves.toMatchObject({
      facturaId: 10,
      userId: 4,
      motivo: 'Duplicada',
    });
  });

  it('acepta una factura sin fecha de vencimiento', async () => {
    await expect(
      validar({ ...payloadDelFront, fechaVencimiento: null }),
    ).resolves.toBeDefined();
  });

  it.each(['facturaId', 'userId', 'motivo'])('exige %s', async (campo) => {
    await expect(
      validar({ ...payloadDelFront, [campo]: undefined }),
    ).rejects.toBeDefined();
  });
});
