import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../../domain/enums/cliente-acceso-internet.enum';
import { AccesoInternetNoEncontradoError } from '../../domain/errors/pppoe-acceso-internet.errors';
import { ClienteAccesoInternetRepositoryFake } from '../../test/fakes/cliente-acceso-internet-repository.fake';
import { BuscarAccesoInternetUseCase } from '../use-cases/buscar-acceso-internet.use-case';
import { CambiarEstadoAccesoInternetUseCase } from '../use-cases/cambiar-estado-acceso-internet.use-case';
import { CrearAccesoInternetUseCase } from '../use-cases/crear-acceso-internet.use-case';
import { RegistrarAccesoInternetAdoptadoUseCase } from '../use-cases/registrar-acceso-internet-adoptado.use-case';

import { PppoeAccesoInternetFacade } from './pppoe-acceso-internet.facade';

describe('PppoeAccesoInternetFacade', () => {
  function preparar() {
    const repo = new ClienteAccesoInternetRepositoryFake();
    const reloj = new RelojFijo('2026-11-24T16:00:00Z');
    const fachada = new PppoeAccesoInternetFacade(
      new BuscarAccesoInternetUseCase(repo),
      new CrearAccesoInternetUseCase(repo, reloj),
      new CambiarEstadoAccesoInternetUseCase(repo, reloj),
      new RegistrarAccesoInternetAdoptadoUseCase(repo),
    );
    return { fachada, reloj };
  }

  const pppoe = {
    empresaId: 1,
    clienteId: 20,
    servicioInternetId: 3,
    tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
    metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
  };

  it('crear devuelve el acceso persistido, PENDIENTE y con la hora del reloj', async () => {
    const { fachada } = preparar();

    const acceso = await fachada.crear(pppoe);

    expect(acceso.id).toBe(1);
    expect(acceso.estado).toBe(EstadoAccesoInternet.PENDIENTE);
    expect(acceso.creadoEn.toISOString()).toBe('2026-11-24T16:00:00.000Z');
  });

  it('cambiarEstado usa la fecha recibida o, sin ella, la del reloj', async () => {
    const { fachada, reloj } = preparar();
    const { id } = await fachada.crear(pppoe);

    reloj.establecer('2026-11-25T16:00:00Z');
    const configurando = await fachada.cambiarEstado({
      accesoInternetId: id,
      transicion: 'INICIAR_CONFIGURACION',
    });
    expect(configurando.estado).toBe(EstadoAccesoInternet.CONFIGURANDO);
    expect(configurando.actualizadoEn.toISOString()).toBe(
      '2026-11-25T16:00:00.000Z',
    );

    const confirmado = new Date('2026-11-25T18:30:00Z');
    const activo = await fachada.cambiarEstado({
      accesoInternetId: id,
      transicion: 'ACTIVAR',
      fecha: confirmado,
    });
    expect(activo.activadoEn!.toISOString()).toBe(confirmado.toISOString());

    expect((await fachada.buscarPorId(id))!.estado).toBe(
      EstadoAccesoInternet.ACTIVO,
    );
  });

  it('cambiarEstado de un acceso inexistente → ACCESO_INTERNET_NO_ENCONTRADO', async () => {
    const { fachada } = preparar();

    await expect(
      fachada.cambiarEstado({ accesoInternetId: 99, transicion: 'ACTIVAR' }),
    ).rejects.toThrow(AccesoInternetNoEncontradoError);
  });

  it('buscarDelCliente exige que el acceso sea del cliente; el vigente ignora los dados de baja', async () => {
    const { fachada } = preparar();
    const viejo = await fachada.crear(pppoe);
    await fachada.cambiarEstado({
      accesoInternetId: viejo.id,
      transicion: 'DAR_DE_BAJA',
    });

    expect(
      await fachada.buscarDelCliente({
        accesoInternetId: viejo.id,
        clienteId: 21,
      }),
    ).toBeNull();
    expect(await fachada.buscarPppoeVigenteDelCliente(20)).toBeNull();

    const nuevo = await fachada.crear(pppoe);
    expect((await fachada.buscarPppoeVigenteDelCliente(20))!.id).toBe(nuevo.id);
  });

  it('registrarAdoptado guarda el acceso en su estado remoto y con la fecha de adopción', async () => {
    const { fachada } = preparar();
    const fechaAdopcion = new Date('2026-11-20T10:00:00Z');

    const acceso = await fachada.registrarAdoptado({
      ...pppoe,
      estadoRemoto: EstadoAccesoInternet.SUSPENDIDO,
      fechaAdopcion,
    });

    expect(acceso.id).toBeGreaterThan(0);
    expect(acceso.estado).toBe(EstadoAccesoInternet.SUSPENDIDO);
    expect(
      await fachada.buscarPppoeVigenteDelCliente(pppoe.clienteId),
    ).toMatchObject({ id: acceso.id });
  });
});
