import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarRutaCobroDto } from './actualizar-ruta-cobro.dto';
import { CrearRutaCobroDto } from './crear-ruta-cobro.dto';
import { ListarRutasCobroQueryDto } from './listar-rutas-cobro-query.dto';

describe('DTO de rutas de cobro', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (metatype: Type, body: object) =>
    pipe.transform(body, { type: 'body', metatype });
  const alta = { nombre: 'Norte', clienteIds: [7, 8] };

  it('acepta el alta mínima y con cobrador y notas', async () => {
    await expect(validar(CrearRutaCobroDto, alta)).resolves.toBeTruthy();
    await expect(
      validar(CrearRutaCobroDto, {
        ...alta,
        cobradorId: 4,
        observaciones: 'nota',
      }),
    ).resolves.toBeTruthy();
  });

  it.each(['empresaId', 'asignadoPor', 'clientesIds', 'nombreRuta', 'estado'])(
    'el alta no admite %s',
    async (campo) => {
      await expect(
        validar(CrearRutaCobroDto, { ...alta, [campo]: 1 }),
      ).rejects.toThrow();
    },
  );

  it.each([
    { nombre: '  ' },
    { clienteIds: [] },
    { clienteIds: ['7'] },
    { clienteIds: [0] },
    { cobradorId: '4' },
  ])('el alta rechaza %p', async (cambio) => {
    await expect(
      validar(CrearRutaCobroDto, { ...alta, ...cambio }),
    ).rejects.toThrow();
  });

  it('la edición acepta campos sueltos y quitar cobrador y notas', async () => {
    await expect(
      validar(ActualizarRutaCobroDto, { estado: 'CERRADO' }),
    ).resolves.toEqual({ estado: 'CERRADO' });
    await expect(
      validar(ActualizarRutaCobroDto, {
        cobradorId: null,
        observaciones: null,
      }),
    ).resolves.toBeTruthy();
  });

  it.each([
    { nombre: null },
    { clienteIds: null },
    { clienteIds: [] },
    { estado: null },
    { estado: 'PENDIENTE' },
    { montoCobrado: 10 },
    { empresaId: 1 },
  ])('la edición no admite %p', async (cambio) => {
    await expect(validar(ActualizarRutaCobroDto, cambio)).rejects.toThrow();
  });

  it('el listado convierte los filtros del query', async () => {
    const query = (await pipe.transform(
      { page: '2', estados: 'ASIGNADA,CERRADO', cobradorId: '4' },
      { type: 'query', metatype: ListarRutasCobroQueryDto },
    )) as ListarRutasCobroQueryDto;

    expect(query).toMatchObject({
      page: 2,
      estados: ['ASIGNADA', 'CERRADO'],
      cobradorId: 4,
    });
  });

  it.each([
    { estado: 'ASIGNADA' },
    { nombreRuta: 'x' },
    { sortBy: 'montoCobrado' },
  ])('el listado no admite %p', async (filtro) => {
    await expect(
      pipe.transform(filtro, {
        type: 'query',
        metatype: ListarRutasCobroQueryDto,
      }),
    ).rejects.toThrow();
  });
});
