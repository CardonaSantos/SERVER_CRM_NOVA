import { UnauthorizedException } from '@nestjs/common';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { PppoeProvisionamientoPort } from 'src/modules/pppoe-automatizacion/public/pppoe-provisionamiento.port';
import { PppoeClienteCuentaFacadePort } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { FlujoActivacionCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/cliente-instalacion-acceso.entity';
import { AccionInstalacionAcceso } from '../../domain/enums/accion-instalacion-acceso.enum';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionPppoeConflictoError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionAccesoRepositoryFake } from '../../test/fakes/cliente-instalacion-acceso-repository.fake';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { PppoeClienteCuentaFacadeFake } from '../../test/fakes/pppoe-cliente-cuenta-facade.fake';
import { PppoeProvisionamientoFake } from '../../test/fakes/pppoe-provisionamiento.fake';
import { ReautenticacionOperadorFake } from '../../test/fakes/reautenticacion-operador.fake';
import { ResolverPppoeInstalacionService } from '../services/resolver-pppoe-instalacion.service';
import { ActivarPppoeInstalacionUseCase } from './activar-pppoe-instalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const INPUT = {
  instalacionId: 100,
  operadorId: 3,
  contrasenaActual: 'secreta',
};

describe('ActivarPppoeInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let vinculos: ClienteInstalacionAccesoRepositoryFake;
  let accesos: PppoeAccesoInternetFacadeFake;
  let cuentas: PppoeClienteCuentaFacadeFake;
  let motor: PppoeProvisionamientoFake;
  let reautenticacion: ReautenticacionOperadorFake;
  let useCase: ActivarPppoeInstalacionUseCase;
  let accesoId: number;

  /** Instalación 100 con su acceso GPON/PPPoE creado y la cuenta lista. */
  function armar(estado = EstadoInstalacionCliente.PROGRAMADA) {
    instalaciones.sembrar(estado, { fechaInicio: AHORA });
    accesoId = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    }).id;
    void vinculos.create(
      ClienteInstalacionAccesoEntity.create(
        {
          instalacionId: 100,
          accesoInternetId: accesoId,
          accion: AccionInstalacionAcceso.CREADO,
        },
        AHORA,
      ),
    );
    cuentas.sembrar(accesoId);
    cuentas.activacion.instalacionId = 100;
  }

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    vinculos = new ClienteInstalacionAccesoRepositoryFake();
    accesos = new PppoeAccesoInternetFacadeFake();
    cuentas = new PppoeClienteCuentaFacadeFake();
    motor = new PppoeProvisionamientoFake();
    reautenticacion = new ReautenticacionOperadorFake();

    useCase = new ActivarPppoeInstalacionUseCase(
      instalaciones,
      new ResolverPppoeInstalacionService(
        vinculos,
        accesos as unknown as PppoeAccesoInternetFacadePort,
        cuentas as unknown as PppoeClienteCuentaFacadePort,
      ),
      cuentas as unknown as PppoeClienteCuentaFacadePort,
      motor as unknown as PppoeProvisionamientoPort,
      reautenticacion,
      new RelojFijo(AHORA),
    );
  });

  it('crea el secret, lo activa y registra la fecha de activación con el reloj', async () => {
    armar();

    const r = await useCase.execute(INPUT);

    expect(reautenticacion.confirmaciones).toEqual([3]);
    expect(motor.peticiones.map((p) => p.paso)).toEqual([
      'crearSecret',
      'activarSecret',
    ]);
    expect(motor.peticiones[0].claveIdempotencia).toBe(
      `cliente-instalacion:100:cuenta-pppoe:${900 + accesoId}:crear-secret`,
    );
    expect(r.activadoEn).toEqual(AHORA);
    expect(r.instalacion.estado).toBe(EstadoInstalacionCliente.EN_PROCESO);
    expect(r.creacion).not.toBeNull();
  });

  it('inicia la instalación y la guarda antes de tocar el router', async () => {
    armar();
    let estadoAlCrear: string | null = null;
    const original = motor.crearSecret.bind(motor);
    motor.crearSecret = (input) => {
      estadoAlCrear = instalaciones.filas.get(100)?.estado ?? null;
      return original(input);
    };

    await useCase.execute(INPUT);

    expect(estadoAlCrear).toBe(EstadoInstalacionCliente.EN_PROCESO);
  });

  it('si el secret ya estaba confirmado no repite CREAR_SECRET', async () => {
    armar();
    cuentas.sembrar(accesoId, { tieneSecretCreado: true });

    const r = await useCase.execute(INPUT);

    expect(motor.peticiones.map((p) => p.paso)).toEqual(['activarSecret']);
    expect(r.creacion).toBeNull();
  });

  it('si la reautenticación falla no se toca nada', async () => {
    armar();
    reautenticacion.rechazar = true;

    await expect(useCase.execute(INPUT)).rejects.toThrow(UnauthorizedException);

    expect(motor.peticiones).toHaveLength(0);
    expect(instalaciones.guardados).toBe(0);
  });

  it('una operación fallida corta el flujo y la instalación queda EN_PROCESO', async () => {
    armar();
    motor.estadoPorPaso.crearSecret = EstadoOperacionPppoe.FALLIDA;
    motor.errorMensaje = 'El router no respondió.';

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'Falló la creación del secret: El router no respondió.',
    );

    expect(motor.peticiones.map((p) => p.paso)).toEqual(['crearSecret']);
    expect(instalaciones.filas.get(100)?.estado).toBe(
      EstadoInstalacionCliente.EN_PROCESO,
    );
    expect(
      instalaciones.filas.get(100)?.toPrimitives().fechaActivacionServicio,
    ).toBeFalsy();
  });

  it('una operación que sigue EJECUTANDO no se da por buena', async () => {
    armar();
    motor.estadoPorPaso.crearSecret = EstadoOperacionPppoe.EJECUTANDO;

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'ya está siendo ejecutada',
    );
  });

  it('la política de la cuenta puede negar la activación sin tocar el estado', async () => {
    armar();
    cuentas.activacion = {
      ...cuentas.activacion,
      habilitada: false,
      motivo: 'La cuenta ya está activa.',
    };

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'La cuenta ya está activa.',
    );
    expect(instalaciones.guardados).toBe(0);
  });

  it('la cuenta debe pertenecer al flujo y a esta instalación', async () => {
    armar();
    cuentas.activacion = {
      ...cuentas.activacion,
      flujo: FlujoActivacionCuentaPppoe.ALTA_MANUAL,
    };
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'no pertenece al flujo de instalación',
    );

    cuentas.activacion = {
      ...cuentas.activacion,
      flujo: FlujoActivacionCuentaPppoe.INSTALACION,
      instalacionId: 555,
    };
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'vinculada a otra instalación',
    );
  });

  it.each([
    EstadoInstalacionCliente.CANCELADA,
    EstadoInstalacionCliente.FALLIDA,
  ])('no activa una instalación %s', async (estado) => {
    armar(estado);

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      ClienteInstalacionPppoeConflictoError,
    );
    expect(motor.peticiones).toHaveLength(0);
  });

  it('una instalación COMPLETADA históricamente sí puede activarse', async () => {
    armar(EstadoInstalacionCliente.COMPLETADA);

    const r = await useCase.execute(INPUT);

    expect(r.instalacion.estado).toBe(EstadoInstalacionCliente.COMPLETADA);
    expect(r.activadoEn).toEqual(AHORA);
  });

  it('una instalación sin acceso GPON/PPPoE nuevo no aplica', async () => {
    instalaciones.sembrar();

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      'no contiene un acceso nuevo GPON/PPPoE',
    );
  });

  it('la instalación inexistente da 404 de dominio', async () => {
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      ClienteInstalacionNoEncontradaError,
    );
  });
});
