import { datosDocumento } from '../../test/fakes/contrato-cliente.fake';
import { armarDocumentoContrato } from './documento-contrato.policy';

const AHORA = new Date('2026-11-27T18:00:00.000Z');

const armar = (
  body: string,
  cambios: Parameters<typeof datosDocumento>[0] = {},
) =>
  armarDocumentoContrato(
    datosDocumento(cambios),
    { id: 3, nombre: 'Hogar', body },
    AHORA,
  );

describe('armarDocumentoContrato', () => {
  it('rellena las variables y deja las desconocidas como están', () => {
    const doc = armar(
      '[nombre_cliente]|[ plan ]|[costo_total]|[fecha_actual]|[otra]|[toString]',
    );

    expect(doc.documento.contenido).toBe(
      'Ana Pérez|Plan 10, precio: Q150.00|Q135.50|27/11/2026|[otra]|[toString]',
    );
    expect(doc.documento).toMatchObject({ numero: 40, fechaEmision: AHORA });
    expect(doc.plantilla).toEqual({ id: 3, nombre: 'Hogar' });
  });

  it('el día de pago es el de la zona de facturación', () => {
    const doc = armar('[dia_pago_mensual]', { diaPagoZona: 5 });

    expect(doc.facturacion.diaPagoMensual).toBe(5);
    expect(doc.documento.contenido).toBe('5');
  });

  it('sin zona usa el día de activación en Guatemala', () => {
    const doc = armar('[dia_pago_mensual]', { diaPagoZona: null });

    // La activación del fake es el 16 a las 03:00 UTC: en Guatemala, día 15.
    expect(doc.facturacion.diaPagoMensual).toBe(15);
  });

  it('usa la dirección del cliente si la instalación no tiene', () => {
    const doc = armar('[direccion_servicio]');

    expect(doc.cliente.direccionServicio).toBe('Zona 1');
    expect(doc.documento.contenido).toBe('Zona 1');
  });
});
