import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarSectorDto } from './actualizar-sector.dto';
import { CrearSectorDto } from './crear-sector.dto';
import { ListarMunicipiosQueryDto } from './listar-municipios-query.dto';

describe('DTO de ubicación', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (metatype: Type, body: object) =>
    pipe.transform(body, { type: 'body', metatype });
  const alta = { nombre: 'Centro', municipioId: 10 };

  it('acepta el alta que envía el formulario', async () => {
    await expect(validar(CrearSectorDto, alta)).resolves.toBeTruthy();
    await expect(
      validar(CrearSectorDto, { ...alta, descripcion: null }),
    ).resolves.toBeTruthy();
  });

  it.each([
    { nombre: '  ' },
    { municipioId: '10' },
    { municipioId: 0 },
    { empresaId: 1 },
  ])('rechaza %j', async (cambio) => {
    await expect(
      validar(CrearSectorDto, { ...alta, ...cambio }),
    ).rejects.toThrow();
  });

  it('la edición admite cuerpos parciales, no null en nombre ni municipio', async () => {
    await expect(
      validar(ActualizarSectorDto, { descripcion: null }),
    ).resolves.toBeTruthy();
    await expect(
      validar(ActualizarSectorDto, { nombre: null }),
    ).rejects.toThrow();
    await expect(
      validar(ActualizarSectorDto, { municipioId: null }),
    ).rejects.toThrow();
  });

  it('el filtro de municipios convierte el departamento', async () => {
    await expect(
      pipe.transform(
        { departamentoId: '8' },
        { type: 'query', metatype: ListarMunicipiosQueryDto },
      ),
    ).resolves.toMatchObject({ departamentoId: 8 });
  });
});
