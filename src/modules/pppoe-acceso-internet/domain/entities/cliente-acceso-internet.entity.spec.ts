import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/cliente-acceso-internet.enum';
import {
  AccesoInternetDadoDeBajaError,
  AccesoInternetDatosInvalidosError,
  AccesoInternetEstadoInvalidoError,
} from '../errors/pppoe-acceso-internet.errors';

import { ClienteAccesoInternetEntity } from './cliente-acceso-internet.entity';

const T0 = new Date('2026-11-24T16:00:00Z');
const T1 = new Date('2026-11-25T16:00:00Z');
const T2 = new Date('2026-11-26T16:00:00Z');

const datos = {
  empresaId: 1,
  clienteId: 20,
  servicioInternetId: 3,
  tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
  metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
};

const nuevo = () => ClienteAccesoInternetEntity.create(datos, T0);

describe('ClienteAccesoInternetEntity', () => {
  it('nace PENDIENTE, sin id ni fechas de estado', () => {
    const p = nuevo().toPrimitives();

    expect(p.id).toBeNull();
    expect(p.estado).toBe(EstadoAccesoInternet.PENDIENTE);
    expect(p.activadoEn).toBeNull();
    expect(p.creadoEn.toISOString()).toBe(T0.toISOString());
    expect(p.actualizadoEn.toISOString()).toBe(T0.toISOString());
  });

  it('rechaza ids no positivos y fechas inválidas con error de dominio', () => {
    expect(() =>
      ClienteAccesoInternetEntity.create({ ...datos, clienteId: 0 }, T0),
    ).toThrow(AccesoInternetDatosInvalidosError);
    expect(() =>
      ClienteAccesoInternetEntity.create(
        { ...datos, servicioInternetId: -1 },
        T0,
      ),
    ).toThrow(AccesoInternetDatosInvalidosError);
    expect(() =>
      ClienteAccesoInternetEntity.create(datos, new Date('x')),
    ).toThrow(AccesoInternetDatosInvalidosError);
  });

  it('ciclo PENDIENTE → CONFIGURANDO → ACTIVO → SUSPENDIDO → ACTIVO conserva la primera activación', () => {
    const a = nuevo();

    a.iniciarConfiguracion(T0);
    expect(a.estado).toBe(EstadoAccesoInternet.CONFIGURANDO);

    a.activar(T1);
    a.suspender(T2);
    expect(a.estado).toBe(EstadoAccesoInternet.SUSPENDIDO);
    expect(a.suspendidoEn!.toISOString()).toBe(T2.toISOString());

    a.activar(new Date('2026-11-27T16:00:00Z'));
    expect(a.estado).toBe(EstadoAccesoInternet.ACTIVO);
    expect(a.activadoEn!.toISOString()).toBe(T1.toISOString());
    expect(a.suspendidoEn).toBeNull();
  });

  it('repetir la transición del estado actual no cambia nada', () => {
    const a = nuevo();
    a.activar(T1);
    a.activar(T2);

    expect(a.actualizadoEn.toISOString()).toBe(T1.toISOString());
  });

  it('solo se suspende un acceso ACTIVO y solo se configura uno PENDIENTE', () => {
    expect(() => nuevo().suspender(T1)).toThrow(
      AccesoInternetEstadoInvalidoError,
    );

    const activo = nuevo();
    activo.activar(T1);
    expect(() => activo.iniciarConfiguracion(T2)).toThrow(
      AccesoInternetEstadoInvalidoError,
    );
  });

  it('dado de baja no admite más cambios salvo repetir la baja', () => {
    const a = nuevo();
    a.darDeBaja(T1);

    expect(a.dadoDeBajaEn!.toISOString()).toBe(T1.toISOString());
    expect(() => a.activar(T2)).toThrow(AccesoInternetDadoDeBajaError);
    expect(() => a.iniciarConfiguracion(T2)).toThrow(
      AccesoInternetDadoDeBajaError,
    );
    expect(() => a.darDeBaja(T2)).not.toThrow();
  });

  it('adoptarExistente refleja el estado remoto sin fechas históricas', () => {
    const a = ClienteAccesoInternetEntity.adoptarExistente({
      ...datos,
      estadoRemoto: EstadoAccesoInternet.SUSPENDIDO,
      fechaAdopcion: T0,
    }).toPrimitives();

    expect(a.estado).toBe(EstadoAccesoInternet.SUSPENDIDO);
    expect(a.suspendidoEn).toBeNull();
    expect(a.creadoEn.toISOString()).toBe(T0.toISOString());

    expect(() =>
      ClienteAccesoInternetEntity.adoptarExistente({
        ...datos,
        estadoRemoto: EstadoAccesoInternet.PENDIENTE as never,
        fechaAdopcion: T0,
      }),
    ).toThrow(AccesoInternetEstadoInvalidoError);
  });

  it('getters y toPrimitives devuelven copias de las fechas', () => {
    const a = ClienteAccesoInternetEntity.hydrate({
      ...nuevo().toPrimitives(),
      id: 9,
    });

    a.creadoEn.setFullYear(2000);
    a.toPrimitives().actualizadoEn.setFullYear(2000);

    expect(a.creadoEn.toISOString()).toBe(T0.toISOString());
    expect(a.actualizadoEn.toISOString()).toBe(T0.toISOString());
  });
});
