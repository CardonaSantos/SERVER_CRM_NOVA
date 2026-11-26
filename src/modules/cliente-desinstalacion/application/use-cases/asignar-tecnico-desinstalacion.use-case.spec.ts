import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  ClienteDesinstalacionNoEncontradaError,
  TecnicoDesinstalacionConflictoError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { ClienteDesinstalacionTecnicoRepositoryFake } from '../../test/fakes/cliente-desinstalacion-tecnico-repository.fake';
import { AsignarTecnicoDesinstalacionUseCase } from './asignar-tecnico-desinstalacion.use-case';
import { EliminarTecnicoDesinstalacionUseCase } from './eliminar-tecnico-desinstalacion.use-case';
import { ListarTecnicosDesinstalacionUseCase } from './listar-tecnicos-desinstalacion.use-case';

describe('técnicos de la desinstalación', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let tecnicos: ClienteDesinstalacionTecnicoRepositoryFake;

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    tecnicos = new ClienteDesinstalacionTecnicoRepositoryFake();
    desinstalaciones.sembrar();
  });

  describe('asignar', () => {
    it('asigna un técnico y no permite un segundo responsable', async () => {
      const useCase = new AsignarTecnicoDesinstalacionUseCase(
        desinstalaciones,
        tecnicos,
      );

      await expect(
        useCase.execute({
          desinstalacionId: 100,
          tecnicoId: 4,
          esResponsable: true,
        }),
      ).resolves.toMatchObject({ tecnicoId: 4, esResponsable: true });
      await expect(
        useCase.execute({ desinstalacionId: 100, tecnicoId: 5 }),
      ).resolves.toMatchObject({ tecnicoId: 5, esResponsable: false });
      await expect(
        useCase.execute({
          desinstalacionId: 100,
          tecnicoId: 6,
          esResponsable: true,
        }),
      ).rejects.toThrow(TecnicoDesinstalacionConflictoError);
    });

    it('una desinstalación finalizada o inexistente no admite técnicos', async () => {
      desinstalaciones.sembrar(EstadoDesinstalacionCliente.COMPLETADA);
      const useCase = new AsignarTecnicoDesinstalacionUseCase(
        desinstalaciones,
        tecnicos,
      );

      await expect(
        useCase.execute({ desinstalacionId: 101, tecnicoId: 4 }),
      ).rejects.toThrow('finalizada');
      await expect(
        useCase.execute({ desinstalacionId: 999, tecnicoId: 4 }),
      ).rejects.toThrow(ClienteDesinstalacionNoEncontradaError);
    });
  });

  describe('listar y eliminar', () => {
    it('lista los técnicos de la desinstalación', async () => {
      await new AsignarTecnicoDesinstalacionUseCase(
        desinstalaciones,
        tecnicos,
      ).execute({
        desinstalacionId: 100,
        tecnicoId: 4,
      });

      const lista = await new ListarTecnicosDesinstalacionUseCase(
        desinstalaciones,
        tecnicos,
      ).execute(100);

      expect(lista).toHaveLength(1);
      await expect(
        new ListarTecnicosDesinstalacionUseCase(
          desinstalaciones,
          tecnicos,
        ).execute(999),
      ).rejects.toThrow(ClienteDesinstalacionNoEncontradaError);
    });

    it('elimina un técnico salvo que la desinstalación esté finalizada', async () => {
      const useCase = new EliminarTecnicoDesinstalacionUseCase(
        desinstalaciones,
        tecnicos,
      );

      await useCase.execute({ desinstalacionId: 100, tecnicoOperacionId: 1 });
      expect(tecnicos.eliminados).toEqual([
        { desinstalacionId: 100, tecnicoOperacionId: 1 },
      ]);

      desinstalaciones.sembrar(EstadoDesinstalacionCliente.COMPLETADA);
      await expect(
        useCase.execute({ desinstalacionId: 101, tecnicoOperacionId: 1 }),
      ).rejects.toThrow('finalizada');
    });
  });
});
