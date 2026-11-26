import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  ClienteInstalacionEstadoInvalidoError,
  ClienteInstalacionNoEncontradaError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { ReprogramarClienteInstalacionUseCase } from './reprogramar-cliente-instalacion.use-case';

describe('ReprogramarClienteInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let useCase: ReprogramarClienteInstalacionUseCase;

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    useCase = new ReprogramarClienteInstalacionUseCase(instalaciones);
  });

  it('pasa a REPROGRAMADA con la nueva fecha y el motivo', async () => {
    instalaciones.sembrar();

    const r = await useCase.execute({
      id: 100,
      fechaProgramada: '2026-12-02T09:00:00Z',
      motivo: 'Lluvia',
    });

    expect(r).toMatchObject({
      estado: EstadoInstalacionCliente.REPROGRAMADA,
      fechaProgramada: new Date('2026-12-02T09:00:00Z'),
      motivo: 'Lluvia',
    });
  });

  it('no se reprograma una instalación en proceso', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO);

    await expect(
      useCase.execute({ id: 100, fechaProgramada: '2026-12-02T09:00:00Z' }),
    ).rejects.toThrow(ClienteInstalacionEstadoInvalidoError);
  });

  it('instalación inexistente', async () => {
    await expect(
      useCase.execute({ id: 1, fechaProgramada: '2026-12-02T09:00:00Z' }),
    ).rejects.toThrow(ClienteInstalacionNoEncontradaError);
  });
});
