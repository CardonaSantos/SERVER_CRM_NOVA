import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { EditarFacturaDto } from './editar-factura.dto';
import { EliminarFacturaDto, EliminarPagoDto } from './eliminar-factura.dto';
import { RegistrarPagoDto, RegistrarPagoRutaDto } from './registrar-pago.dto';

describe('DTO de facturación', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (metatype: Type, body: object) =>
    pipe.transform(body, { type: 'body', metatype });
  const pago = {
    facturaInternetId: 1,
    clienteId: 7,
    montoPagado: 150.5,
    metodoPago: 'EFECTIVO',
    numeroBoleta: '',
  };

  it('registra pagos con el método como texto', async () => {
    const dto = (await validar(RegistrarPagoDto, {
      ...pago,
      fechaPago: '2026-11-26T18:00:00.000Z',
    })) as RegistrarPagoDto;

    expect(dto.fechaPago).toBeInstanceOf(Date);
    await expect(
      validar(RegistrarPagoRutaDto, { ...pago, rutaId: 3 }),
    ).resolves.toBeTruthy();
  });

  it.each([
    { cobradorId: 1 },
    { serviciosAdicionales: [] },
    { metodoPago: 'CHEQUE' },
    { montoPagado: 0 },
    { montoPagado: 1.234 },
    { montoPagado: '150' },
  ])('el pago no admite %p', async (cambio) => {
    await expect(
      validar(RegistrarPagoDto, { ...pago, ...cambio }),
    ).rejects.toThrow();
  });

  it('el pago en ruta exige la ruta', async () => {
    await expect(validar(RegistrarPagoRutaDto, pago)).rejects.toThrow();
  });

  it.each([{}, { motivo: '   ' }])(
    'eliminar exige motivo: %p',
    async (body) => {
      await expect(validar(EliminarPagoDto, body)).rejects.toThrow();
    },
  );

  it('eliminar factura no admite el usuario en el cuerpo', async () => {
    await expect(
      validar(EliminarFacturaDto, { facturaId: 1, motivo: 'x' }),
    ).resolves.toBeTruthy();
    await expect(
      validar(EliminarFacturaDto, { facturaId: 1, motivo: 'x', userId: 2 }),
    ).rejects.toThrow();
  });

  it('la edición acepta campos sueltos', async () => {
    await expect(validar(EditarFacturaDto, { anulada: true })).resolves.toEqual(
      { anulada: true },
    );
  });

  it.each([
    { estadoFacturaInternet: 'PAGADA' },
    { saldoPendiente: 0 },
    { fechaPagada: null },
    { montoPago: null },
    { montoPago: -1 },
    { fechaPagoEsperada: null },
    { anulada: 'true' },
  ])('la edición no admite %p', async (body) => {
    await expect(validar(EditarFacturaDto, body)).rejects.toThrow();
  });
});
