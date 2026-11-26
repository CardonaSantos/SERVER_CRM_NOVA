import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { ClienteInstalacionQueryFake } from '../../test/fakes/cliente-instalacion-query.fake';
import { ListarClienteInstalacionesUseCase } from './listar-cliente-instalaciones.use-case';
import { ListarMisInstalacionesAsignadasUseCase } from './listar-mis-instalaciones-asignadas.use-case';

describe('ListarClienteInstalacionesUseCase', () => {
  it('normaliza la paginación y convierte filtros y fechas', async () => {
    const consultas = new ClienteInstalacionQueryFake();
    const useCase = new ListarClienteInstalacionesUseCase(consultas);

    const r = await useCase.execute({
      limit: 500,
      estado: EstadoInstalacionCliente.PROGRAMADA,
      clienteId: 7,
      fechaProgramadaDesde: '2026-11-01T00:00:00Z',
    });

    expect(consultas.paginacionRecibida).toEqual({ page: 1, limit: 100 });
    expect(consultas.filtrosRecibidos).toMatchObject({
      estado: EstadoInstalacionCliente.PROGRAMADA,
      clienteId: 7,
      asesorId: null,
      fechaProgramadaDesde: new Date('2026-11-01T00:00:00Z'),
      fechaProgramadaHasta: null,
    });
    expect(r).toMatchObject({ page: 1, limit: 100, total: 0 });
  });
});

describe('ListarMisInstalacionesAsignadasUseCase', () => {
  it('pasa el técnico del token y recorta la búsqueda', async () => {
    const consultas = new ClienteInstalacionQueryFake();
    const useCase = new ListarMisInstalacionesAsignadasUseCase(consultas);

    await useCase.execute({
      tecnicoId: 3,
      page: 2,
      limit: 5,
      search: '  perez  ',
    });

    expect(consultas.paginacionRecibida).toEqual({ page: 2, limit: 5 });
    expect(consultas.filtrosAsignadasRecibidos).toMatchObject({
      tecnicoId: 3,
      search: 'perez',
      estado: null,
    });
  });

  it('una búsqueda vacía queda en null', async () => {
    const consultas = new ClienteInstalacionQueryFake();

    await new ListarMisInstalacionesAsignadasUseCase(consultas).execute({
      tecnicoId: 3,
      search: '   ',
    });

    expect(consultas.filtrosAsignadasRecibidos?.search).toBeNull();
  });
});
