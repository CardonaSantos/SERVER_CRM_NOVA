import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desinstalacion.enum';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  AutorizacionDesinstalacionConflictoError,
  ClienteDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionAutorizacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-autorizacion-repository.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { CrearAutorizacionDesinstalacionUseCase } from './crear-autorizacion-cliente-desinstalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('CrearAutorizacionDesinstalacionUseCase', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let autorizaciones: ClienteDesinstalacionAutorizacionRepositoryFake;
  let useCase: CrearAutorizacionDesinstalacionUseCase;

  const input = {
    desinstalacionId: 100,
    solicitadoPorId: 3,
    motivoSolicitud: 'Mora',
  };

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    autorizaciones = new ClienteDesinstalacionAutorizacionRepositoryFake();
    useCase = new CrearAutorizacionDesinstalacionUseCase(
      desinstalaciones,
      autorizaciones,
      new RelojFijo(AHORA),
    );
  });

  it('crea una solicitud PENDIENTE con la fecha del reloj', async () => {
    desinstalaciones.sembrar();

    const r = await useCase.execute(input);

    expect(r).toMatchObject({
      estado: EstadoAutorizacionDesinstalacion.PENDIENTE,
      solicitadoPorId: 3,
      motivoSolicitud: 'Mora',
      fechaSolicitud: AHORA,
    });
  });

  it('no se duplica una pendiente ni se pide otra si ya hay una aprobada', async () => {
    desinstalaciones.sembrar();
    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Ya existe una autorización pendiente',
    );

    autorizaciones.filas
      .get(1)!
      .aprobar({ autorizadoPorId: 9, fechaRespuesta: AHORA });
    await expect(useCase.execute(input)).rejects.toThrow(
      'ya cuenta con una autorización aprobada',
    );
  });

  it('tras un rechazo se puede volver a solicitar', async () => {
    desinstalaciones.sembrar();
    await useCase.execute(input);
    autorizaciones.filas
      .get(1)!
      .rechazar({ autorizadoPorId: 9, fechaRespuesta: AHORA });

    await expect(useCase.execute(input)).resolves.toMatchObject({
      estado: EstadoAutorizacionDesinstalacion.PENDIENTE,
    });
  });

  it('una desinstalación finalizada no admite solicitudes', async () => {
    desinstalaciones.sembrar(EstadoDesinstalacionCliente.COMPLETADA);

    await expect(useCase.execute(input)).rejects.toThrow(
      AutorizacionDesinstalacionConflictoError,
    );
  });

  it('desinstalación inexistente', async () => {
    await expect(useCase.execute(input)).rejects.toThrow(
      ClienteDesinstalacionNoEncontradaError,
    );
  });
});
