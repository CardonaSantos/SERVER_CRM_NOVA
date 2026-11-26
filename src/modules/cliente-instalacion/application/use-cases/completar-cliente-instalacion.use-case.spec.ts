import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionEstadoInvalidoError,
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionProhibidaError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { CompletarClienteInstalacionUseCase } from './completar-cliente-instalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('CompletarClienteInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let useCase: CompletarClienteInstalacionUseCase;

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    useCase = new CompletarClienteInstalacionUseCase(
      instalaciones,
      new RelojFijo(AHORA),
    );
  });

  const input = (extra = {}) => ({
    id: 100,
    operadorId: 3,
    soloSiEstaAsignado: false,
    ...extra,
  });

  it('completa una instalación EN_PROCESO con la fecha del reloj y quién la completó', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO);

    const r = await useCase.execute(input({ resultado: 'ok' }));

    expect(r).toMatchObject({
      estado: EstadoInstalacionCliente.COMPLETADA,
      completadoPorId: 3,
      fechaFinalizacion: AHORA,
      resultado: 'ok',
    });
    expect(instalaciones.guardados).toBe(1);
  });

  it('respeta la fecha enviada y rechaza una inválida', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO);

    const r = await useCase.execute(
      input({ fechaFinalizacion: '2026-11-24T10:00:00Z' }),
    );
    expect(r.fechaFinalizacion).toEqual(new Date('2026-11-24T10:00:00Z'));

    instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO);
    await expect(
      useCase.execute(input({ id: 101, fechaFinalizacion: 'no-es-fecha' })),
    ).rejects.toThrow(ClienteInstalacionDatosInvalidosError);
  });

  it('repetir la petición devuelve lo ya completado sin guardar de nuevo', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.COMPLETADA);

    const r = await useCase.execute(input());

    expect(r.estado).toBe(EstadoInstalacionCliente.COMPLETADA);
    expect(instalaciones.guardados).toBe(0);
  });

  it('un técnico solo completa lo que tiene asignado', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO);

    await expect(
      useCase.execute(input({ soloSiEstaAsignado: true })),
    ).rejects.toThrow(ClienteInstalacionProhibidaError);
    expect(instalaciones.guardados).toBe(0);

    instalaciones.asignar(100, 3);
    await expect(
      useCase.execute(input({ soloSiEstaAsignado: true })),
    ).resolves.toMatchObject({ estado: EstadoInstalacionCliente.COMPLETADA });
  });

  it('oficina completa cualquiera aunque no figure asignada', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO);

    await expect(
      useCase.execute(input({ soloSiEstaAsignado: false })),
    ).resolves.toBeDefined();
  });

  it('solo desde EN_PROCESO', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.PROGRAMADA);

    await expect(useCase.execute(input())).rejects.toThrow(
      ClienteInstalacionEstadoInvalidoError,
    );
  });

  it('instalación inexistente', async () => {
    await expect(useCase.execute(input())).rejects.toThrow(
      ClienteInstalacionNoEncontradaError,
    );
  });
});
