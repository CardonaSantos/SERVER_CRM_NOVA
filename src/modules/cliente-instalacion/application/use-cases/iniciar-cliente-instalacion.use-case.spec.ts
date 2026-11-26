import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionEstadoInvalidoError,
  ClienteInstalacionNoEncontradaError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { IniciarClienteInstalacionUseCase } from './iniciar-cliente-instalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('IniciarClienteInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let useCase: IniciarClienteInstalacionUseCase;

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    useCase = new IniciarClienteInstalacionUseCase(
      instalaciones,
      new RelojFijo(AHORA),
    );
  });

  it('inicia una instalación asignada al técnico con la fecha del reloj', async () => {
    instalaciones.sembrar();
    instalaciones.asignar(100, 3);

    const r = await useCase.execute({ id: 100, tecnicoId: 3 });

    expect(r).toMatchObject({
      estado: EstadoInstalacionCliente.EN_PROCESO,
      fechaInicio: AHORA,
    });
  });

  it('usa la fecha enviada y rechaza una inválida', async () => {
    instalaciones.sembrar();
    instalaciones.asignar(100, 3);

    const r = await useCase.execute({
      id: 100,
      tecnicoId: 3,
      fechaInicio: '2026-11-25T14:50:00Z',
    });
    expect(r.fechaInicio).toEqual(new Date('2026-11-25T14:50:00Z'));

    instalaciones.sembrar();
    instalaciones.asignar(101, 3);
    await expect(
      useCase.execute({ id: 101, tecnicoId: 3, fechaInicio: 'ayer' }),
    ).rejects.toThrow(ClienteInstalacionDatosInvalidosError);
  });

  it('si no es suya responde 404 de dominio, sin revelar que existe', async () => {
    instalaciones.sembrar();
    instalaciones.asignar(100, 8);

    await expect(useCase.execute({ id: 100, tecnicoId: 3 })).rejects.toThrow(
      ClienteInstalacionNoEncontradaError,
    );
  });

  it('repetir la petición no cambia la fecha de inicio ni guarda de nuevo', async () => {
    const e = instalaciones.sembrar(EstadoInstalacionCliente.EN_PROCESO, {
      fechaInicio: new Date('2026-11-20T08:00:00Z'),
    });
    instalaciones.asignar(100, 3);

    const r = await useCase.execute({ id: e.id as number, tecnicoId: 3 });

    expect(r.fechaInicio).toEqual(new Date('2026-11-20T08:00:00Z'));
    expect(instalaciones.guardados).toBe(0);
  });

  it.each([
    EstadoInstalacionCliente.COMPLETADA,
    EstadoInstalacionCliente.CANCELADA,
  ])('no se inicia desde %s', async (estado) => {
    instalaciones.sembrar(estado);
    instalaciones.asignar(100, 3);

    await expect(useCase.execute({ id: 100, tecnicoId: 3 })).rejects.toThrow(
      ClienteInstalacionEstadoInvalidoError,
    );
  });
});
