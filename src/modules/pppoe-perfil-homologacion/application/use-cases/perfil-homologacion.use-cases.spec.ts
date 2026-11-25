import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  PerfilHomologacionCodigoDuplicadoError,
  PerfilHomologacionDuplicadoError,
  PerfilHomologacionNoEncontradoError,
} from '../../domain/errors/pppoe-perfil-homologacion.errors';
import { PerfilHomologacionRepositoryFake } from '../../test/fakes/perfil-homologacion-repository.fake';
import { PppoePerfilHomologacionFacade } from '../facade/pppoe-perfil-homologacion.facade';

import { ActualizarCodigoPerfilHomologacionUseCase } from './actualizar-codigo-perfil-homologacion.use-case';
import { BuscarPerfilHomologacionUseCase } from './buscar-perfil-homologacion.use-case';
import { CrearPerfilHomologacionUseCase } from './crear-perfil-homologacion.use-case';
import { DesactivarPerfilHomologacionUseCase } from './desactivar-perfil-homologacion.use-case';

describe('Casos de uso de homologación PPPoE', () => {
  function preparar() {
    const repo = new PerfilHomologacionRepositoryFake();
    const reloj = new RelojFijo('2026-11-24T16:00:00Z');
    return {
      repo,
      reloj,
      crear: new CrearPerfilHomologacionUseCase(repo, reloj),
      actualizar: new ActualizarCodigoPerfilHomologacionUseCase(repo, reloj),
      desactivar: new DesactivarPerfilHomologacionUseCase(repo, reloj),
      fachada: new PppoePerfilHomologacionFacade(
        new BuscarPerfilHomologacionUseCase(repo),
      ),
    };
  }

  const alta = {
    empresaId: 1,
    creadoPorId: 9,
    mikrotikRouterId: 4,
    servicioInternetId: 7,
    codigoPerfil: 'PLAN-20M',
  };

  it('crear con la hora del reloj; router + servicio o código repetidos → conflicto', async () => {
    const { crear } = preparar();

    const creada = await crear.execute(alta);
    expect(creada.id).toBe(1);
    expect(creada.creadoEn.toISOString()).toBe('2026-11-24T16:00:00.000Z');

    await expect(crear.execute(alta)).rejects.toThrow(
      PerfilHomologacionDuplicadoError,
    );
    await expect(
      crear.execute({
        ...alta,
        servicioInternetId: 8,
        codigoPerfil: ' PLAN-20M ',
      }),
    ).rejects.toThrow(PerfilHomologacionCodigoDuplicadoError);
  });

  it('actualizar código: igual no escribe, ajeno en el router choca, inexistente → no encontrado', async () => {
    const { crear, actualizar, repo } = preparar();
    const a = await crear.execute(alta);
    await crear.execute({
      ...alta,
      servicioInternetId: 8,
      codigoPerfil: 'PLAN-50M',
    });
    const escrituras = repo.escrituras;

    await actualizar.execute({
      id: a.id,
      codigoPerfil: ' PLAN-20M ',
      actualizadoPorId: 3,
    });
    expect(repo.escrituras).toBe(escrituras);

    await expect(
      actualizar.execute({
        id: a.id,
        codigoPerfil: 'PLAN-50M',
        actualizadoPorId: 3,
      }),
    ).rejects.toThrow(PerfilHomologacionCodigoDuplicadoError);

    await expect(
      actualizar.execute({ id: 99, codigoPerfil: 'X', actualizadoPorId: 3 }),
    ).rejects.toThrow(PerfilHomologacionNoEncontradoError);
  });

  it('la fachada solo ofrece la homologación activa para prealtas', async () => {
    const { crear, desactivar, fachada, reloj } = preparar();
    const a = await crear.execute(alta);
    const clave = { mikrotikRouterId: 4, servicioInternetId: 7 };

    expect((await fachada.buscarActivoPorRouterYServicio(clave))!.id).toBe(
      a.id,
    );

    reloj.establecer('2026-11-25T16:00:00Z');
    const inactiva = await desactivar.execute({
      id: a.id,
      actualizadoPorId: 3,
    });
    expect(inactiva.actualizadoEn.toISOString()).toBe(
      '2026-11-25T16:00:00.000Z',
    );

    expect(await fachada.buscarActivoPorRouterYServicio(clave)).toBeNull();
    expect((await fachada.buscarPorId(a.id))!.activo).toBe(false);
    expect(await fachada.buscarPorId(99)).toBeNull();
  });
});
