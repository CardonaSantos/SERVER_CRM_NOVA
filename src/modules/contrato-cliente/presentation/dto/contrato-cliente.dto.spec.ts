import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { CrearContratoClienteDto } from './crear-contrato-cliente.dto';
import { EditarPlantillaContratoDto } from './editar-plantilla-contrato.dto';
import { ObtenerDocumentoContratoQueryDto } from './obtener-documento-contrato-query.dto';

const pipe = new ValidacionGlobalPipe();

const cuerpo = (metatype: new () => object, valor: object) =>
  pipe.transform(valor, { type: 'body', metatype });

describe('DTOs de contrato-cliente', () => {
  it('admite el alta con fechas sin hora', async () => {
    await expect(
      cuerpo(CrearContratoClienteDto, {
        clienteId: 7,
        fechaPago: '2026-07-01',
        costoInstalacion: 0,
        observaciones: '',
      }),
    ).resolves.toMatchObject({ fechaPago: '2026-07-01' });
  });

  it.each([
    { clienteId: 7, fechaPago: '2026-07-01T00:00:00Z' },
    { clienteId: 7, costoInstalacion: -1 },
    { clienteId: 7, wifiPassword: 'x' },
  ])('rechaza el alta %o', async (valor) => {
    await expect(cuerpo(CrearContratoClienteDto, valor)).rejects.toThrow();
  });

  it('editar plantilla: parcial, sin vaciar ni pedir empresa', async () => {
    await expect(
      cuerpo(EditarPlantillaContratoDto, { nombre: 'Hogar' }),
    ).resolves.toMatchObject({ nombre: 'Hogar' });

    for (const valor of [{ body: ' ' }, { nombre: null }, { empresaId: 1 }]) {
      await expect(cuerpo(EditarPlantillaContratoDto, valor)).rejects.toThrow();
    }
  });

  it('el documento convierte los ids de la query', async () => {
    await expect(
      pipe.transform(
        { instalacionId: '4', plantillaId: '2' },
        { type: 'query', metatype: ObtenerDocumentoContratoQueryDto },
      ),
    ).resolves.toMatchObject({ instalacionId: 4, plantillaId: 2 });
  });
});
