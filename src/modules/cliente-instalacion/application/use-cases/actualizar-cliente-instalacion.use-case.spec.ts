import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionTecnicoInvalidoError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { ActualizarClienteInstalacionUseCase } from './actualizar-cliente-instalacion.use-case';

const responsable = {
  tecnicoId: 4,
  rol: RolTecnicoOperacionCliente.RESPONSABLE,
  esResponsable: true,
};

describe('ActualizarClienteInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let useCase: ActualizarClienteInstalacionUseCase;

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    instalaciones.sembrar();
    useCase = new ActualizarClienteInstalacionUseCase(instalaciones);
  });

  it('actualiza datos y costos', async () => {
    const r = await useCase.execute({
      id: 100,
      descripcion: '  casa azul ',
      fechaProgramada: '2026-12-01T10:00:00Z',
      costos: { costoInstalacion: 150, montoCobradoCliente: 100 },
    });

    expect(r).toMatchObject({
      descripcion: 'casa azul',
      fechaProgramada: new Date('2026-12-01T10:00:00Z'),
      costoInstalacion: 150,
      montoCobradoCliente: 100,
    });
  });

  it('fechaProgramada null la borra y ausente no la toca', async () => {
    await useCase.execute({ id: 100, fechaProgramada: '2026-12-01T10:00:00Z' });

    const sinTocar = await useCase.execute({ id: 100, descripcion: 'x' });
    expect(sinTocar.fechaProgramada).toEqual(new Date('2026-12-01T10:00:00Z'));

    const borrada = await useCase.execute({ id: 100, fechaProgramada: null });
    expect(borrada.fechaProgramada).toBeNull();
  });

  it('lo cobrado no puede superar el costo total', async () => {
    await expect(
      useCase.execute({
        id: 100,
        costos: { costoInstalacion: 10, montoCobradoCliente: 50 },
      }),
    ).rejects.toThrow(ClienteInstalacionDatosInvalidosError);
  });

  it('sin técnicos en el Input no toca las asignaciones; con técnicos las reemplaza', async () => {
    await useCase.execute({ id: 100, descripcion: 'a' });
    expect(instalaciones.tecnicosReemplazados).toHaveLength(0);

    await useCase.execute({
      id: 100,
      tecnicos: [
        responsable,
        {
          tecnicoId: 5,
          rol: RolTecnicoOperacionCliente.APOYO,
          esResponsable: false,
          tiempoMinutos: 30,
        },
      ],
    });

    expect(instalaciones.tecnicosReemplazados[0]).toEqual([
      expect.objectContaining({
        tecnicoId: 4,
        esResponsable: true,
        tiempoMinutos: null,
      }),
      expect.objectContaining({ tecnicoId: 5, tiempoMinutos: 30 }),
    ]);
  });

  it('una lista de técnicos inválida se rechaza antes de guardar nada', async () => {
    await expect(
      useCase.execute({
        id: 100,
        descripcion: 'cambio',
        tecnicos: [responsable, { ...responsable, tecnicoId: 6 }],
      }),
    ).rejects.toThrow(ClienteInstalacionTecnicoInvalidoError);

    expect(instalaciones.guardados).toBe(0);
  });

  it('un técnico inexistente lo rechaza el repositorio', async () => {
    instalaciones.tecnicosInvalidos.add(4);

    await expect(
      useCase.execute({ id: 100, tecnicos: [responsable] }),
    ).rejects.toThrow(ClienteInstalacionTecnicoInvalidoError);
  });

  it('instalación inexistente', async () => {
    await expect(useCase.execute({ id: 999 })).rejects.toThrow(
      ClienteInstalacionNoEncontradaError,
    );
  });
});
