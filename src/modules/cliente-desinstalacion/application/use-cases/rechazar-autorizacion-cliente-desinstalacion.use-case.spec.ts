import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desinstalacion.enum';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  AutorizacionDesinstalacionConflictoError,
  AutorizacionDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionAutorizacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-autorizacion-repository.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { RechazarAutorizacionDesinstalacionUseCase } from './rechazar-autorizacion-cliente-desinstalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('RechazarAutorizacionDesinstalacionUseCase', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let autorizaciones: ClienteDesinstalacionAutorizacionRepositoryFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  let useCase: RechazarAutorizacionDesinstalacionUseCase;

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    autorizaciones = new ClienteDesinstalacionAutorizacionRepositoryFake();
    unidad = new UnidadDeTrabajoEnMemoria();
    useCase = new RechazarAutorizacionDesinstalacionUseCase(
      autorizaciones,
      desinstalaciones,
      unidad,
      new RelojFijo(AHORA),
    );
  });

  it('rechaza la autorización y cancela la desinstalación, juntas, con la fecha del reloj', async () => {
    desinstalaciones.sembrar();
    autorizaciones.sembrar(100);

    const r = await useCase.execute({
      id: 1,
      autorizadoPorId: 9,
      comentarioAutorizador: 'no procede',
    });

    expect(unidad.aperturas).toHaveLength(1);
    expect(r.autorizacion).toMatchObject({
      estado: EstadoAutorizacionDesinstalacion.RECHAZADA,
      comentarioAutorizador: 'no procede',
      fechaRespuesta: AHORA,
    });
    expect(r.desinstalacion).toMatchObject({
      estado: EstadoDesinstalacionCliente.CANCELADA,
      fechaCancelacion: AHORA,
    });
  });

  it('una desinstalación finalizada no admite el rechazo', async () => {
    desinstalaciones.sembrar(EstadoDesinstalacionCliente.COMPLETADA);
    autorizaciones.sembrar(100);

    await expect(
      useCase.execute({ id: 1, autorizadoPorId: 9 }),
    ).rejects.toThrow(AutorizacionDesinstalacionConflictoError);
    expect(autorizaciones.guardados).toBe(0);
  });

  it('una autorización ya respondida no se rechaza de nuevo y no guarda nada', async () => {
    desinstalaciones.sembrar();
    autorizaciones.sembrar(100);
    await useCase.execute({ id: 1, autorizadoPorId: 9 });
    desinstalaciones.guardados = 0;
    autorizaciones.guardados = 0;

    await expect(
      useCase.execute({ id: 1, autorizadoPorId: 9 }),
    ).rejects.toThrow();

    expect(desinstalaciones.guardados).toBe(0);
    expect(autorizaciones.guardados).toBe(0);
  });

  it('autorización inexistente', async () => {
    await expect(
      useCase.execute({ id: 5, autorizadoPorId: 9 }),
    ).rejects.toThrow(AutorizacionDesinstalacionNoEncontradaError);
  });
});
