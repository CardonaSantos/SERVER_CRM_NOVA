import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  ClienteDesinstalacionClienteNoEncontradoError,
  ClienteDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionDetalle } from '../../domain/read-models/cliente-desinstalacion.read-model';
import { AutorizacionDesinstalacionQueryFake } from '../../test/fakes/autorizacion-desinstalacion-query.fake';
import { ClienteDesinstalacionContextoQueryFake } from '../../test/fakes/cliente-desinstalacion-contexto-query.fake';
import { ClienteDesinstalacionQueryFake } from '../../test/fakes/cliente-desinstalacion-query.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';
import { ActualizarClienteDesinstalacionUseCase } from './actualizar-cliente-desinstalacion.use-case';
import { ListarAutorizacionesPendientesUseCase } from './listar-autorizaciones-pendientes-desinstalacion.use-case';
import { ListarClienteDesinstalacionesUseCase } from './listar-cliente-desinstalaciones.use-case';
import { ObtenerClienteDesinstalacionUseCase } from './obtener-cliente-desinstalacion.use-case';
import { ObtenerContextoCreacionDesinstalacionUseCase } from './obtener-contexto-creacion-desinstalacion.use-case';

describe('consultas de desinstalación', () => {
  it('listar normaliza la paginación y convierte filtros y fechas', async () => {
    const consultas = new ClienteDesinstalacionQueryFake();

    const r = await new ListarClienteDesinstalacionesUseCase(consultas).execute(
      {
        limit: 500,
        estado: EstadoDesinstalacionCliente.PROGRAMADA,
        clienteId: 7,
        fechaProgramadaDesde: '2026-11-01T00:00:00Z',
      },
    );

    expect(consultas.paginacionRecibida).toEqual({ page: 1, limit: 100 });
    expect(consultas.filtrosRecibidos).toMatchObject({
      estado: EstadoDesinstalacionCliente.PROGRAMADA,
      clienteId: 7,
      motivo: null,
      fechaProgramadaDesde: new Date('2026-11-01T00:00:00Z'),
      fechaProgramadaHasta: null,
    });
    expect(r).toMatchObject({ page: 1, limit: 100, total: 0 });
  });

  it('autorizaciones pendientes usa la paginación común', async () => {
    const consultas = new AutorizacionDesinstalacionQueryFake();

    await new ListarAutorizacionesPendientesUseCase(consultas).execute({
      page: 2,
      limit: 5,
    });

    expect(consultas.paginacionRecibida).toEqual({ page: 2, limit: 5 });
  });

  it('obtener devuelve el detalle o 404 de dominio', async () => {
    const consultas = new ClienteDesinstalacionQueryFake();
    consultas.detalles.set(5, {
      desinstalacion: { id: 5 },
    } as ClienteDesinstalacionDetalle);
    const useCase = new ObtenerClienteDesinstalacionUseCase(consultas);

    await expect(useCase.execute({ id: 5 })).resolves.toMatchObject({
      desinstalacion: { id: 5 },
    });
    await expect(useCase.execute({ id: 6 })).rejects.toThrow(
      ClienteDesinstalacionNoEncontradaError,
    );
  });

  it('el contexto de creación de un cliente inexistente da 404 de dominio', async () => {
    const useCase = new ObtenerContextoCreacionDesinstalacionUseCase(
      new ClienteDesinstalacionContextoQueryFake(),
    );

    await expect(useCase.execute(7)).rejects.toThrow(
      ClienteDesinstalacionClienteNoEncontradoError,
    );
  });
});

describe('ActualizarClienteDesinstalacionUseCase', () => {
  it('valida el acceso final, normaliza la fecha y guarda', async () => {
    const repo = new ClienteDesinstalacionRepositoryFake();
    const accesos = new PppoeAccesoInternetFacadeFake();
    const acceso = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });
    repo.sembrar();
    const useCase = new ActualizarClienteDesinstalacionUseCase(
      repo,
      new ValidarAccesoDesinstalacionService(
        accesos as unknown as PppoeAccesoInternetFacadePort,
      ),
    );

    const r = await useCase.execute({
      id: 100,
      accesoInternetId: acceso.id,
      fechaProgramada: '2026-12-02T09:00:00Z',
      observaciones: '  nota ',
    });

    expect(r).toMatchObject({
      accesoInternetId: acceso.id,
      fechaProgramada: new Date('2026-12-02T09:00:00Z'),
      observaciones: 'nota',
    });
    await expect(
      useCase.execute({ id: 100, accesoInternetId: 999 }),
    ).rejects.toThrow();
    await expect(useCase.execute({ id: 9 })).rejects.toThrow(
      ClienteDesinstalacionNoEncontradaError,
    );
  });
});
