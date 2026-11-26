import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { CerrarDesinstalacionService } from '../services/cerrar-desinstalacion.service';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  ClienteDesinstalacionEstadoInvalidoError,
  ClienteDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { CancelarClienteDesinstalacionUseCase } from './cancelar-cliente-desinstalacion.use-case';
import { CompletarClienteDesinstalacionUseCase } from './completar-cliente-desinstalacion.use-case';
import { MarcarFallidaClienteDesinstalacionUseCase } from './marcar-fallida-cliente-desinstalacion.use-case';
import { ReprogramarClienteDesinstalacionUseCase } from './reprogramar-cliente-desinstalacion.use-case';

const AHORA = new Date('2026-11-26T15:00:00.000Z');

describe('transiciones de la desinstalación', () => {
  let repo: ClienteDesinstalacionRepositoryFake;
  const reloj = new RelojFijo(AHORA);
  /** El cierre (cliente DESINSTALADO) tiene su propia prueba. */
  const cierre = {
    guardarCompletada: (d) => repo.save(d),
  } as CerrarDesinstalacionService;

  beforeEach(() => {
    repo = new ClienteDesinstalacionRepositoryFake();
  });

  describe('CompletarClienteDesinstalacionUseCase', () => {
    it('completa con la fecha del reloj y lo que informó el técnico', async () => {
      repo.sembrar(EstadoDesinstalacionCliente.EN_PROCESO);

      const r = await new CompletarClienteDesinstalacionUseCase(
        repo,
        reloj,
        cierre,
      ).execute({
        id: 100,
        ejecutadoPorId: 3,
        resultado: 'Equipo retirado',
        equipoRecuperado: true,
        conforme: true,
      });

      expect(r).toMatchObject({
        estado: EstadoDesinstalacionCliente.COMPLETADA,
        fechaFinalizacion: AHORA,
        equipoRecuperado: true,
        conforme: true,
      });
    });

    it('solo desde EN_PROCESO; inexistente da 404 de dominio', async () => {
      repo.sembrar(EstadoDesinstalacionCliente.PROGRAMADA);
      const useCase = new CompletarClienteDesinstalacionUseCase(
        repo,
        reloj,
        cierre,
      );

      await expect(
        useCase.execute({ id: 100, ejecutadoPorId: 3 }),
      ).rejects.toThrow(ClienteDesinstalacionEstadoInvalidoError);
      await expect(
        useCase.execute({ id: 1, ejecutadoPorId: 3 }),
      ).rejects.toThrow(ClienteDesinstalacionNoEncontradaError);
    });
  });

  describe('CancelarClienteDesinstalacionUseCase', () => {
    it('cancela con la fecha del reloj, o con la enviada', async () => {
      repo.sembrar();
      repo.sembrar();
      const useCase = new CancelarClienteDesinstalacionUseCase(repo, reloj);

      const a = await useCase.execute({ id: 100, observaciones: 'x' });
      const b = await useCase.execute({
        id: 101,
        fechaCancelacion: '2026-11-25T20:00:00Z',
      });

      expect(a).toMatchObject({
        estado: EstadoDesinstalacionCliente.CANCELADA,
        fechaCancelacion: AHORA,
      });
      expect(b.fechaCancelacion).toEqual(new Date('2026-11-25T20:00:00Z'));
    });

    it('una desinstalación completada no se cancela', async () => {
      repo.sembrar(EstadoDesinstalacionCliente.COMPLETADA);

      await expect(
        new CancelarClienteDesinstalacionUseCase(repo, reloj).execute({
          id: 100,
        }),
      ).rejects.toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('MarcarFallidaClienteDesinstalacionUseCase', () => {
    it('solo desde EN_PROCESO, con la fecha del reloj', async () => {
      repo.sembrar(EstadoDesinstalacionCliente.EN_PROCESO);
      repo.sembrar(EstadoDesinstalacionCliente.PROGRAMADA);
      const useCase = new MarcarFallidaClienteDesinstalacionUseCase(
        repo,
        reloj,
      );

      await expect(
        useCase.execute({ id: 100, resultado: 'Cliente ausente' }),
      ).resolves.toMatchObject({
        estado: EstadoDesinstalacionCliente.FALLIDA,
        fechaFinalizacion: AHORA,
      });
      await expect(useCase.execute({ id: 101 })).rejects.toThrow(
        ClienteDesinstalacionEstadoInvalidoError,
      );
    });
  });

  describe('ReprogramarClienteDesinstalacionUseCase', () => {
    it('solo PROGRAMADA, con nueva fecha y motivo', async () => {
      repo.sembrar();
      repo.sembrar(EstadoDesinstalacionCliente.EN_PROCESO);
      const useCase = new ReprogramarClienteDesinstalacionUseCase(repo);

      await expect(
        useCase.execute({ id: 100, fechaProgramada: '2026-12-05T10:00:00Z' }),
      ).resolves.toMatchObject({
        fechaProgramada: new Date('2026-12-05T10:00:00Z'),
      });
      await expect(
        useCase.execute({ id: 101, fechaProgramada: '2026-12-05T10:00:00Z' }),
      ).rejects.toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });
});
