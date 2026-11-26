import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  AutorizacionDesinstalacionConflictoError,
  ClienteDesinstalacionEstadoInvalidoError,
  ClienteDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionAutorizacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-autorizacion-repository.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { ValidarAutorizacionDesinstalacionService } from '../services/validar-autorizacion-desinstalacion.service';
import { IniciarClienteDesinstalacionUseCase } from './iniciar-cliente-desinstalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('IniciarClienteDesinstalacionUseCase', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let autorizaciones: ClienteDesinstalacionAutorizacionRepositoryFake;
  let useCase: IniciarClienteDesinstalacionUseCase;

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    autorizaciones = new ClienteDesinstalacionAutorizacionRepositoryFake();
    useCase = new IniciarClienteDesinstalacionUseCase(
      desinstalaciones,
      new RelojFijo(AHORA),
      new ValidarAutorizacionDesinstalacionService(autorizaciones),
    );
  });

  const aprobar = (desinstalacionId: number) =>
    autorizaciones
      .sembrar(desinstalacionId)
      .aprobar({ autorizadoPorId: 9, fechaRespuesta: AHORA });

  it('con autorización aprobada inicia con la fecha del reloj y el ejecutor', async () => {
    desinstalaciones.sembrar();
    aprobar(100);

    const r = await useCase.execute({ id: 100, ejecutadoPorId: 3 });

    expect(r).toMatchObject({
      estado: EstadoDesinstalacionCliente.EN_PROCESO,
      ejecutadoPorId: 3,
      fechaInicio: AHORA,
    });
  });

  it('sin autorización, o con una pendiente o rechazada, no inicia', async () => {
    desinstalaciones.sembrar();

    await expect(
      useCase.execute({ id: 100, ejecutadoPorId: 3 }),
    ).rejects.toThrow('requiere una autorización aprobada');

    autorizaciones.sembrar(100);
    await expect(
      useCase.execute({ id: 100, ejecutadoPorId: 3 }),
    ).rejects.toThrow('todavía está pendiente');
    expect(desinstalaciones.guardados).toBe(0);
  });

  it('una autorización rechazada no sirve', async () => {
    desinstalaciones.sembrar();
    autorizaciones
      .sembrar(100)
      .rechazar({ autorizadoPorId: 9, fechaRespuesta: AHORA });

    await expect(
      useCase.execute({ id: 100, ejecutadoPorId: 3 }),
    ).rejects.toThrow(AutorizacionDesinstalacionConflictoError);
  });

  it('solo desde PROGRAMADA', async () => {
    desinstalaciones.sembrar(EstadoDesinstalacionCliente.EN_PROCESO);
    aprobar(100);

    await expect(
      useCase.execute({ id: 100, ejecutadoPorId: 3 }),
    ).rejects.toThrow(ClienteDesinstalacionEstadoInvalidoError);
  });

  it('desinstalación inexistente', async () => {
    await expect(useCase.execute({ id: 1, ejecutadoPorId: 3 })).rejects.toThrow(
      ClienteDesinstalacionNoEncontradaError,
    );
  });
});
