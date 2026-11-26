import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ListarClientesRutaQueryDto } from './listar-clientes-ruta-query.dto';
import { ListarClientesQueryDto } from './listar-clientes-query.dto';

type Dto = typeof ListarClientesQueryDto | typeof ListarClientesRutaQueryDto;

const validar = (metatype: Dto, query: unknown) =>
  new ValidacionGlobalPipe().transform(query, { type: 'query', metatype });

describe('filtros de las listas de clientes', () => {
  it('convierte los números que llegan como texto', async () => {
    await expect(
      validar(ListarClientesQueryDto, {
        page: '2',
        limit: '20',
        zonaId: '3',
        estado: 'ACTIVO',
        search: ' ana ',
      }),
    ).resolves.toMatchObject({ page: 2, limit: 20, zonaId: 3, search: 'ana' });
  });

  it.each([[['1', '2']], ['1,2']])(
    'acepta varias zonas como %j',
    async (zonaIds) => {
      await expect(
        validar(ListarClientesRutaQueryDto, { zonaIds, sortBy: 'saldo' }),
      ).resolves.toMatchObject({ zonaIds: [1, 2], sortBy: 'saldo' });
    },
  );

  it.each([
    [{ zonaIds: 'abc' }],
    [{ sortBy: 'telefono' }],
    [{ limit: '500' }],
    [{ perPage: '10' }],
  ])('rechaza %j', async (query) => {
    await expect(
      validar(ListarClientesRutaQueryDto, query),
    ).rejects.toBeDefined();
  });
});
