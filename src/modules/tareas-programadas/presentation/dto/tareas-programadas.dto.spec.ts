import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';

import { EjecutarTareaManualDto } from './ejecutar-tarea-manual.dto';
import { ListarEjecucionesTareaQueryDto } from './listar-ejecuciones-tarea-query.dto';

const consultar = (query: unknown) =>
  new ValidacionGlobalPipe().transform(query, {
    type: 'query',
    metatype: ListarEjecucionesTareaQueryDto,
  });

describe('DTO de tareas programadas', () => {
  it('convierte la query como llega de la URL', async () => {
    await expect(
      consultar({
        page: '2',
        desde: '2027-03-01',
        hasta: '2027-03-06',
        tarea: 'GENERAR_FACTURAS',
        estados: 'FALLIDA',
        facturacionZonaId: '3',
        sortBy: 'fechaOperativa',
        search: ' zona-3 ',
      }),
    ).resolves.toMatchObject({
      page: 2,
      estados: ['FALLIDA'],
      facturacionZonaId: 3,
      sortBy: 'fechaOperativa',
      search: 'zona-3',
    });
  });

  it.each([
    { desde: '06/03/2027' },
    { hasta: '2027-02-30' },
    { tarea: 'generar facturas' },
    { estados: ['OTRA'] },
    { facturacionZonaId: '0' },
    { sortBy: 'clave' },
    { extra: 'x' },
  ])('rechaza %o', async (query) => {
    await expect(consultar(query)).rejects.toBeDefined();
  });

  it('ejecutar a mano exige la contraseña y nada más', async () => {
    const validar = (body: unknown) =>
      new ValidacionGlobalPipe().transform(body, {
        type: 'body',
        metatype: EjecutarTareaManualDto,
      });

    await expect(validar({ contrasenaActual: 'x' })).resolves.toEqual({
      contrasenaActual: 'x',
    });
    await expect(validar({})).rejects.toBeDefined();
    await expect(
      validar({ contrasenaActual: 'x', clave: 'OTRA:2027-03-06' }),
    ).rejects.toBeDefined();
  });
});
