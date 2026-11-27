import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarEmpresaDto } from './actualizar-empresa.dto';

const pipe = new ValidacionGlobalPipe();

const validar = (cuerpo: object) =>
  pipe.transform(cuerpo, { type: 'body', metatype: ActualizarEmpresaDto });

describe('ActualizarEmpresaDto', () => {
  it('un texto vacío llega como null y se admite', async () => {
    await expect(
      validar({ correo: '', sitioWeb: ' ', logo1: null }),
    ).resolves.toMatchObject({ correo: null, sitioWeb: null, logo1: null });
  });

  it.each([
    { nombre: '' },
    { nombre: null },
    { correo: 'sin-arroba' },
    { logo2: 'no es una url' },
    { id: 2 },
  ])('rechaza %o', async (cuerpo) => {
    await expect(validar(cuerpo)).rejects.toThrow();
  });
});
