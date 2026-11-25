import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { EstadoCuentaPppoe } from '../../domain/enums/estado-cuenta-pppoe.enum';
import { CuentaPppoeNoEncontradaError } from '../../domain/errors/pppoe-cliente-cuenta.errors';
import { ClientePppoeCuentaRepositoryFake } from '../../test/fakes/cliente-pppoe-cuenta-repository.fake';
import { BuscarCuentaPppoeUseCase } from '../use-cases/buscar-cuenta-pppoe.use-case';
import { CambiarEstadoCuentaPppoeUseCase } from '../use-cases/cambiar-estado-cuenta-pppoe.use-case';
import { CrearCuentaPppoeUseCase } from '../use-cases/crear-cuenta-pppoe.use-case';
import { RegistrarErrorCuentaPppoeUseCase } from '../use-cases/registrar-error-cuenta-pppoe.use-case';

import { PppoeClienteCuentaFacade } from './pppoe-cliente-cuenta.facade';

describe('PppoeClienteCuentaFacade', () => {
  function preparar() {
    const repo = new ClientePppoeCuentaRepositoryFake();
    const reloj = new RelojFijo('2026-11-24T16:00:00Z');
    const sinUso = null as never;
    const fachada = new PppoeClienteCuentaFacade(
      new BuscarCuentaPppoeUseCase(repo),
      new CrearCuentaPppoeUseCase(repo, reloj),
      new CambiarEstadoCuentaPppoeUseCase(repo, reloj),
      new RegistrarErrorCuentaPppoeUseCase(repo, reloj),
      sinUso,
      sinUso,
    );
    return { fachada, reloj };
  }

  const alta = {
    empresaId: 1,
    accesoInternetId: 10,
    perfilHomologacionId: 3,
    usuario: 'cliente.prueba',
    secretoCifrado: 'cifrado',
    secretoIv: 'iv',
    secretoAuthTag: 'tag',
    versionClave: 1,
    generadoPorId: 7,
  };

  it('crear devuelve el read model con el secreto protegido y la hora del reloj', async () => {
    const { fachada } = preparar();

    const cuenta = await fachada.crear(alta);

    expect(cuenta.id).toBe(1);
    expect(cuenta.estaPendienteActivacion).toBe(true);
    expect(cuenta.secretoProtegido.versionClave).toBe(1);
    expect(cuenta.generadoEn.toISOString()).toBe('2026-11-24T16:00:00.000Z');
    expect((await fachada.buscarPorAccesoInternet(10))!.id).toBe(cuenta.id);
  });

  it('cambiarEstado persiste la transición con la fecha recibida o la del reloj', async () => {
    const { fachada, reloj } = preparar();
    const { id } = await fachada.crear(alta);

    reloj.establecer('2026-11-25T16:00:00Z');
    await fachada.cambiarEstado({
      cuentaPppoeId: id,
      transicion: 'INICIAR_INSTALACION',
    });
    const confirmado = new Date('2026-11-25T16:05:00Z');
    const conSecret = await fachada.cambiarEstado({
      cuentaPppoeId: id,
      transicion: 'MARCAR_SECRET_CREADO',
      fecha: confirmado,
    });

    expect(conSecret.tieneSecretCreado).toBe(true);
    expect(conSecret.secretCreadoEn!.toISOString()).toBe(
      confirmado.toISOString(),
    );
    expect((await fachada.buscarPorId(id))!.estado).toBe(
      EstadoCuentaPppoe.EN_INSTALACION,
    );
  });

  it('registrarError deja la cuenta en ERROR; cuenta inexistente → no encontrada', async () => {
    const { fachada } = preparar();
    const { id } = await fachada.crear(alta);

    const conError = await fachada.registrarError({
      cuentaPppoeId: id,
      mensaje: 'Router sin respuesta',
    });
    expect(conError.estado).toBe(EstadoCuentaPppoe.ERROR);
    expect(conError.ultimoError).toBe('Router sin respuesta');

    await expect(
      fachada.cambiarEstado({ cuentaPppoeId: 99, transicion: 'MARCAR_ACTIVA' }),
    ).rejects.toThrow(CuentaPppoeNoEncontradaError);
  });

  it('buscarVigentePorUsuario ignora las cuentas eliminadas', async () => {
    const { fachada } = preparar();
    const { id } = await fachada.crear(alta);

    expect((await fachada.buscarVigentePorUsuario('cliente.prueba'))!.id).toBe(
      id,
    );

    await fachada.cambiarEstado({
      cuentaPppoeId: id,
      transicion: 'INICIAR_DESINSTALACION',
    });
    await fachada.cambiarEstado({
      cuentaPppoeId: id,
      transicion: 'MARCAR_ELIMINADA',
    });

    expect(await fachada.buscarVigentePorUsuario('cliente.prueba')).toBeNull();
  });
});
