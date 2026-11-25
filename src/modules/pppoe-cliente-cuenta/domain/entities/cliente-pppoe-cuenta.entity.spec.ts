import { EstadoCuentaPppoe } from '../enums/estado-cuenta-pppoe.enum';
import {
  CuentaPppoeDatosInvalidosError,
  CuentaPppoeEliminadaError,
  CuentaPppoeEstadoInvalidoError,
} from '../errors/pppoe-cliente-cuenta.errors';

import { ClientePppoeCuentaEntity } from './cliente-pppoe-cuenta.entity';

const T0 = new Date('2026-11-24T16:00:00Z');
const T1 = new Date('2026-11-25T16:00:00Z');
const T2 = new Date('2026-11-26T16:00:00Z');

const secreto = {
  secretoCifrado: 'cifrado',
  secretoIv: 'iv',
  secretoAuthTag: 'tag',
  versionClave: 1,
};

const alta = {
  empresaId: 1,
  accesoInternetId: 10,
  perfilHomologacionId: 3,
  usuario: 'cliente.prueba',
  generadoPorId: 7,
  ...secreto,
};

const persistida = () =>
  ClientePppoeCuentaEntity.hydrate({
    ...ClientePppoeCuentaEntity.create(alta, T0).toPrimitives(),
    id: 1,
  });

describe('ClientePppoeCuentaEntity', () => {
  it('nace PENDIENTE_ACTIVACION con la fecha recibida y sin secret creado', () => {
    const c = ClientePppoeCuentaEntity.create(alta, T0);

    expect(c.estado).toBe(EstadoCuentaPppoe.PENDIENTE_ACTIVACION);
    expect(c.generadoEn.toISOString()).toBe(T0.toISOString());
    expect(c.tieneSecretCreado).toBe(false);
    expect(c.secretoProtegido).toEqual(secreto);
  });

  it('rechaza usuarios con espacios y datos obligatorios vacíos', () => {
    expect(() =>
      ClientePppoeCuentaEntity.create({ ...alta, usuario: 'con espacio' }, T0),
    ).toThrow(CuentaPppoeDatosInvalidosError);
    expect(() =>
      ClientePppoeCuentaEntity.create({ ...alta, secretoIv: ' ' }, T0),
    ).toThrow(CuentaPppoeDatosInvalidosError);
    expect(() => ClientePppoeCuentaEntity.create(alta, new Date('x'))).toThrow(
      CuentaPppoeDatosInvalidosError,
    );
  });

  it('ciclo completo: instalación → secret → activa → suspendida → activa → baja', () => {
    const c = persistida();

    c.iniciarInstalacion(T0);
    c.marcarSecretCreado(T0);
    expect(c.tieneSecretCreado).toBe(true);

    c.iniciarActivacion(T1);
    c.marcarActiva(T1);
    expect(c.estaActiva).toBe(true);
    expect(c.activadoEn!.toISOString()).toBe(T1.toISOString());

    c.marcarSuspendida(T2);
    expect(c.estaSuspendida).toBe(true);
    c.iniciarActivacion(T2);
    c.marcarActiva(T2);

    c.iniciarDesinstalacion(T2);
    c.marcarEliminada(T2);
    expect(c.estaEliminada).toBe(true);
    expect(c.eliminadoEn!.toISOString()).toBe(T2.toISOString());
  });

  it('transiciones fuera de orden → CUENTA_PPPOE_ESTADO_INVALIDO', () => {
    expect(() => persistida().marcarActiva(T1)).toThrow(
      CuentaPppoeEstadoInvalidoError,
    );

    const enInstalacion = persistida();
    enInstalacion.iniciarInstalacion(T0);
    expect(() => enInstalacion.iniciarActivacion(T1)).toThrow(
      /secret todavía no ha sido confirmado/,
    );
  });

  it('un error permite reintentar según si el secret ya existe', () => {
    const sinSecret = persistida();
    sinSecret.iniciarInstalacion(T0);
    sinSecret.registrarError('Router sin respuesta', T1);
    expect(sinSecret.estado).toBe(EstadoCuentaPppoe.ERROR);
    expect(() => sinSecret.reintentarActivacion(T1)).toThrow(
      CuentaPppoeEstadoInvalidoError,
    );
    sinSecret.reintentarInstalacion(T2);
    expect(sinSecret.estado).toBe(EstadoCuentaPppoe.EN_INSTALACION);

    const conSecret = persistida();
    conSecret.iniciarInstalacion(T0);
    conSecret.marcarSecretCreado(T0);
    conSecret.registrarError('Falló enable', T1);
    expect(() => conSecret.reintentarInstalacion(T1)).toThrow(
      /reintentar la activación/,
    );
    conSecret.reintentarActivacion(T2);
    expect(conSecret.estado).toBe(EstadoCuentaPppoe.EN_ACTIVACION);
  });

  it('una cuenta eliminada no admite registrar errores', () => {
    const c = persistida();
    c.iniciarDesinstalacion(T0);
    c.marcarEliminada(T1);

    expect(() => c.registrarError('x', T2)).toThrow(CuentaPppoeEliminadaError);
  });

  it('adoptarExistente refleja el estado remoto y cuenta como secret creado', () => {
    const c = ClientePppoeCuentaEntity.adoptarExistente({
      ...alta,
      estadoRemoto: EstadoCuentaPppoe.SUSPENDIDA,
      adoptadoPorId: 7,
      fechaAdopcion: T0,
    });

    expect(c.esAdoptada).toBe(true);
    expect(c.tieneSecretCreado).toBe(true);
    expect(c.estado).toBe(EstadoCuentaPppoe.SUSPENDIDA);
    expect(c.activadoEn).toBeNull();

    expect(() =>
      ClientePppoeCuentaEntity.adoptarExistente({
        ...alta,
        estadoRemoto: EstadoCuentaPppoe.PENDIENTE_ACTIVACION as never,
        adoptadoPorId: 7,
        fechaAdopcion: T0,
      }),
    ).toThrow(CuentaPppoeEstadoInvalidoError);
  });
});
