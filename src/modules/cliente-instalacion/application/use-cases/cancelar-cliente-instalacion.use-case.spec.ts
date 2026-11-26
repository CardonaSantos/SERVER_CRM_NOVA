import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionEstadoInvalidoError,
  ClienteInstalacionNoEncontradaError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { CancelarClienteInstalacionUseCase } from './cancelar-cliente-instalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('CancelarClienteInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let useCase: CancelarClienteInstalacionUseCase;

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    useCase = new CancelarClienteInstalacionUseCase(
      instalaciones,
      new RelojFijo(AHORA),
    );
  });

  it('cancela con motivo y la fecha del reloj', async () => {
    instalaciones.sembrar();

    const r = await useCase.execute({ id: 100, motivo: 'El cliente desistió' });

    expect(r).toMatchObject({
      estado: EstadoInstalacionCliente.CANCELADA,
      motivo: 'El cliente desistió',
      fechaCancelacion: AHORA,
    });
  });

  it('respeta la fecha enviada', async () => {
    instalaciones.sembrar();

    const r = await useCase.execute({
      id: 100,
      motivo: 'x',
      fechaCancelacion: '2026-11-20T00:00:00Z',
    });

    expect(r.fechaCancelacion).toEqual(new Date('2026-11-20T00:00:00Z'));
  });

  it('el motivo es obligatorio', async () => {
    instalaciones.sembrar();

    await expect(useCase.execute({ id: 100, motivo: '  ' })).rejects.toThrow(
      ClienteInstalacionDatosInvalidosError,
    );
  });

  it('una instalación completada no se cancela', async () => {
    instalaciones.sembrar(EstadoInstalacionCliente.COMPLETADA);

    await expect(useCase.execute({ id: 100, motivo: 'x' })).rejects.toThrow(
      ClienteInstalacionEstadoInvalidoError,
    );
  });

  it('instalación inexistente: 404 de dominio y no un error de programa', async () => {
    await expect(useCase.execute({ id: 1, motivo: 'x' })).rejects.toThrow(
      ClienteInstalacionNoEncontradaError,
    );
  });
});
