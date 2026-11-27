import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { DATOS_ZONA } from '../../test/fakes/zona-facturacion-repository.fake';
import { ActualizarZonaFacturacionDto } from './actualizar-zona-facturacion.dto';
import { CrearZonaFacturacionDto } from './crear-zona-facturacion.dto';

describe('DTO de zonas de facturación', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (metatype: Type, body: object) =>
    pipe.transform(body, { type: 'body', metatype });
  // El alta ya no envía la empresa: sale de la sesión.
  const alta = { ...DATOS_ZONA, empresaId: undefined };
  delete alta.empresaId;

  it('acepta el alta completa y sin corte', async () => {
    await expect(validar(CrearZonaFacturacionDto, alta)).resolves.toBeTruthy();
    await expect(
      validar(CrearZonaFacturacionDto, {
        ...alta,
        diaCorte: null,
        suspenderTrasFacturas: null,
      }),
    ).resolves.toBeTruthy();
  });

  it.each([
    'empresaId',
    'creadoEn',
    'whatsapp',
    'telegram',
    'horaRecordatorio',
    'clientesCount',
  ])('ya no admite %s', async (campo) => {
    await expect(
      validar(CrearZonaFacturacionDto, { ...alta, [campo]: 1 }),
    ).rejects.toThrow();
  });

  it.each([
    { nombre: '  ' },
    { diaPago: 32 },
    { diaCorte: 0 },
    { suspenderTrasFacturas: 13 },
    { enviarRecordatorio: 'true' },
  ])('rechaza %p', async (cambio) => {
    await expect(
      validar(CrearZonaFacturacionDto, { ...alta, ...cambio }),
    ).rejects.toThrow();
  });

  it('la edición acepta campos sueltos y quitar el corte', async () => {
    await expect(
      validar(ActualizarZonaFacturacionDto, { diaPago: 12 }),
    ).resolves.toEqual({ diaPago: 12 });
    await expect(
      validar(ActualizarZonaFacturacionDto, {
        diaCorte: null,
        suspenderTrasFacturas: null,
      }),
    ).resolves.toBeTruthy();
  });

  it.each([{ nombre: null }, { diaPago: null }, { enviarAvisoPago: null }])(
    'la edición no admite %p',
    async (cambio) => {
      await expect(
        validar(ActualizarZonaFacturacionDto, cambio),
      ).rejects.toThrow();
    },
  );
});
