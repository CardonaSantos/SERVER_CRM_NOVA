import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { PppoeProvisionamientoPort } from 'src/modules/pppoe-automatizacion/public/pppoe-provisionamiento.port';
import { PppoeClienteCuentaFacadePort } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desinstalacion.enum';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import {
  AutorizacionDesinstalacionConflictoError,
  AutorizacionDesinstalacionNoEncontradaError,
  ClienteDesinstalacionAccesoInvalidoError,
  ClienteDesinstalacionPppoeConflictoError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionAutorizacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-autorizacion-repository.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { PppoeClienteCuentaFacadeFake } from '../../test/fakes/pppoe-cliente-cuenta-facade.fake';
import { PppoeProvisionamientoFake } from '../../test/fakes/pppoe-provisionamiento.fake';
import { ReautenticacionOperadorFake } from '../../test/fakes/reautenticacion-operador.fake';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';
import { AprobarAutorizacionDesinstalacionUseCase } from './aprobar-autorizacion-cliente-desinstalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const INPUT = { id: 1, autorizadoPorId: 9, contrasenaActual: 'secreta' };

describe('AprobarAutorizacionDesinstalacionUseCase', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let autorizaciones: ClienteDesinstalacionAutorizacionRepositoryFake;
  let accesos: PppoeAccesoInternetFacadeFake;
  let cuentas: PppoeClienteCuentaFacadeFake;
  let motor: PppoeProvisionamientoFake;
  let reautenticacion: ReautenticacionOperadorFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  let useCase: AprobarAutorizacionDesinstalacionUseCase;
  let accesoId: number;

  /** Desinstalación PROGRAMADA (id 100) con su acceso, su cuenta y una autorización pendiente (id 1). */
  function armar() {
    accesoId = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    }).id;
    desinstalaciones.sembrar(EstadoDesinstalacionCliente.PROGRAMADA, {
      accesoInternetId: accesoId,
    });
    autorizaciones.sembrar(100);
    cuentas.sembrar(accesoId);
  }

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    autorizaciones = new ClienteDesinstalacionAutorizacionRepositoryFake();
    accesos = new PppoeAccesoInternetFacadeFake();
    cuentas = new PppoeClienteCuentaFacadeFake();
    motor = new PppoeProvisionamientoFake();
    reautenticacion = new ReautenticacionOperadorFake();
    unidad = new UnidadDeTrabajoEnMemoria();

    useCase = new AprobarAutorizacionDesinstalacionUseCase(
      autorizaciones,
      desinstalaciones,
      new ValidarAccesoDesinstalacionService(
        accesos as unknown as PppoeAccesoInternetFacadePort,
      ),
      reautenticacion,
      cuentas as unknown as PppoeClienteCuentaFacadePort,
      motor as unknown as PppoeProvisionamientoPort,
      unidad,
      new RelojFijo(AHORA),
    );
  });

  it('aprueba, inicia, elimina el secret y completa la desinstalación', async () => {
    armar();

    const r = await useCase.execute(INPUT);

    expect(reautenticacion.confirmaciones).toEqual([9]);
    expect(motor.peticiones[0]).toMatchObject({
      cuentaPppoeId: 900 + accesoId,
      desinstalacionId: 100,
      instalacionId: null,
      claveIdempotencia: 'desinstalacion:100:eliminar-secret:v1',
    });
    expect(r.autorizacion).toMatchObject({
      estado: EstadoAutorizacionDesinstalacion.APROBADA,
      autorizadoPorId: 9,
      fechaRespuesta: AHORA,
    });
    expect(r.desinstalacion).toMatchObject({
      estado: EstadoDesinstalacionCliente.COMPLETADA,
      ejecutadoPorId: 9,
      equipoRecuperado: false,
    });
    expect(r.desinstalacion.resultado).toContain('Baja PPPoE confirmada');
  });

  it('aprobar e iniciar se guardan juntos y antes de tocar el router', async () => {
    armar();
    let abiertaAlGuardar = false;
    const guardarOriginal = desinstalaciones.save.bind(desinstalaciones);
    desinstalaciones.save = (entidad) => {
      abiertaAlGuardar ||= unidad.abierta;
      return guardarOriginal(entidad);
    };
    let estadoAlEliminar: string | undefined;
    let aprobadaAlEliminar: string | undefined;
    motor.alResponder = () => {
      estadoAlEliminar = desinstalaciones.filas.get(100)?.estado;
      aprobadaAlEliminar = autorizaciones.filas.get(1)?.estado;
    };

    await useCase.execute(INPUT);

    expect(unidad.aperturas).toHaveLength(1);
    expect(abiertaAlGuardar).toBe(true);
    expect(estadoAlEliminar).toBe(EstadoDesinstalacionCliente.EN_PROCESO);
    expect(aprobadaAlEliminar).toBe(EstadoAutorizacionDesinstalacion.APROBADA);
  });

  it('si la baja no deja la cuenta ELIMINADA no completa y queda EN_PROCESO', async () => {
    armar();
    motor.estadoCuenta = EstadoCuentaPppoe.ERROR;

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      ClienteDesinstalacionPppoeConflictoError,
    );

    expect(desinstalaciones.filas.get(100)?.estado).toBe(
      EstadoDesinstalacionCliente.EN_PROCESO,
    );
  });

  it('si el router falla, la aprobación ya quedó guardada y la desinstalación EN_PROCESO', async () => {
    armar();
    motor.falla = new Error('router caído');

    await expect(useCase.execute(INPUT)).rejects.toThrow('router caído');

    expect(autorizaciones.filas.get(1)?.estado).toBe(
      EstadoAutorizacionDesinstalacion.APROBADA,
    );
    expect(desinstalaciones.filas.get(100)?.estado).toBe(
      EstadoDesinstalacionCliente.EN_PROCESO,
    );
  });

  it('si la reautenticación falla no se escribe ni se toca el router', async () => {
    armar();
    reautenticacion.rechazar = true;

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'No se pudo confirmar la identidad',
    );

    expect(motor.peticiones).toHaveLength(0);
    expect(autorizaciones.guardados).toBe(0);
    expect(desinstalaciones.guardados).toBe(0);
  });

  it('una autorización ya respondida no se aprueba de nuevo', async () => {
    armar();
    await useCase.execute(INPUT);

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      AutorizacionDesinstalacionConflictoError,
    );
  });

  it('autorización inexistente', async () => {
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      AutorizacionDesinstalacionNoEncontradaError,
    );
  });

  it('una desinstalación finalizada no se autoriza', async () => {
    armar();
    desinstalaciones.sembrar(EstadoDesinstalacionCliente.COMPLETADA);
    autorizaciones.sembrar(101);

    await expect(useCase.execute({ ...INPUT, id: 2 })).rejects.toThrow(
      'finalizada',
    );
  });

  it('exige acceso con cuenta PPPoE y no dado de baja', async () => {
    armar();
    cuentas.cuentas.clear();
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'no tiene una cuenta PPPoE asociada',
    );

    cuentas.sembrar(accesoId);
    accesos.accesos.set(accesoId, {
      ...accesos.accesos.get(accesoId)!,
      estado: EstadoAccesoInternet.BAJA,
    });
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      ClienteDesinstalacionAccesoInvalidoError,
    );
    expect(motor.peticiones).toHaveLength(0);
  });

  it('sin acceso asociado no se puede aprobar', async () => {
    desinstalaciones.sembrar(EstadoDesinstalacionCliente.PROGRAMADA, {
      accesoInternetId: null,
    });
    autorizaciones.sembrar(100);

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'no tiene un acceso de internet asociado',
    );
  });
});
