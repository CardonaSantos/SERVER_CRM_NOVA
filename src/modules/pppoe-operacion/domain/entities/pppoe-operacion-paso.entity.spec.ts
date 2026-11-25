import { EstadoPasoPppoe, TipoPasoPppoe } from '../enums/pppoe-operacion.enum';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
} from '../errors/pppoe-operacion.errors';

import { PppoeOperacionPasoEntity } from './pppoe-operacion-paso.entity';

const T0 = new Date('2026-11-25T15:00:00Z');
const T1 = new Date('2026-11-25T15:00:01Z');
const T2 = new Date('2026-11-25T15:00:03Z');

const nuevo = () =>
  PppoeOperacionPasoEntity.create(
    { operacionId: 5, tipo: TipoPasoPppoe.BUSCAR_SECRET, orden: 1 },
    T0,
  );

const ejecutando = () => {
  const p = nuevo();
  p.iniciar({ comandoSanitizado: '/ppp secret print', fecha: T1 });
  return p;
};

describe('PppoeOperacionPasoEntity', () => {
  it('nace PENDIENTE sin fechas de ejecución', () => {
    const p = nuevo();

    expect(p.estado).toBe(EstadoPasoPppoe.PENDIENTE);
    expect(p.iniciadoEn).toBeNull();
    expect(p.toPrimitives().creadoEn).toEqual(T0);
  });

  it('rechaza orden u operacionId que no sean enteros positivos', () => {
    expect(() =>
      PppoeOperacionPasoEntity.create(
        { operacionId: 5, tipo: TipoPasoPppoe.BUSCAR_SECRET, orden: 0 },
        T0,
      ),
    ).toThrow(OperacionPppoeDatosInvalidosError);
    expect(() =>
      PppoeOperacionPasoEntity.create(
        { operacionId: -1, tipo: TipoPasoPppoe.BUSCAR_SECRET, orden: 1 },
        T0,
      ),
    ).toThrow(OperacionPppoeDatosInvalidosError);
  });

  it('PENDIENTE → EJECUTANDO → EXITOSO calcula la duración', () => {
    const p = ejecutando();
    expect(p.estaEjecutando()).toBe(true);

    p.marcarExitoso({ respuestaSanitizada: 'ok', fecha: T2 });

    expect(p.fueExitoso()).toBe(true);
    expect(p.esTerminal()).toBe(true);
    expect(p.duracionMs).toBe(2000);
    expect(p.finalizadoEn).toEqual(T2);
  });

  it('EJECUTANDO → FALLIDO guarda el código normalizado en mayúsculas', () => {
    const p = ejecutando();

    p.marcarFallido({
      errorCodigo: 'ssh_timeout',
      errorMensaje: 'El router no respondió.',
      fecha: T2,
    });

    expect(p.fueFallido()).toBe(true);
    expect(p.toPrimitives().errorCodigo).toBe('SSH_TIMEOUT');
  });

  it('FALLIDO exige código y mensaje', () => {
    expect(() =>
      ejecutando().marcarFallido({
        errorCodigo: '  ',
        errorMensaje: 'x',
        fecha: T2,
      }),
    ).toThrow(OperacionPppoeDatosInvalidosError);
    expect(() =>
      ejecutando().marcarFallido({
        errorCodigo: 'X',
        errorMensaje: '',
        fecha: T2,
      }),
    ).toThrow(OperacionPppoeDatosInvalidosError);
  });

  it('PENDIENTE → OMITIDO no registra inicio y dura cero', () => {
    const p = nuevo();

    p.omitir({ motivo: 'El secret ya existe.', fecha: T1 });

    expect(p.fueOmitido()).toBe(true);
    expect(p.iniciadoEn).toBeNull();
    expect(p.duracionMs).toBe(0);
  });

  it('rechaza transiciones desde un estado que no corresponde', () => {
    expect(() => nuevo().marcarExitoso({ fecha: T1 })).toThrow(
      OperacionPppoeEstadoInvalidoError,
    );
    expect(() => ejecutando().iniciar({ fecha: T2 })).toThrow(
      OperacionPppoeEstadoInvalidoError,
    );
    expect(() => ejecutando().omitir({ fecha: T2 })).toThrow(
      OperacionPppoeEstadoInvalidoError,
    );
  });

  it('rechaza fechas anteriores a la creación o al inicio', () => {
    expect(() =>
      nuevo().iniciar({ fecha: new Date('2026-11-25T14:00:00Z') }),
    ).toThrow(OperacionPppoeDatosInvalidosError);
    expect(() => ejecutando().marcarExitoso({ fecha: T0 })).toThrow(
      OperacionPppoeDatosInvalidosError,
    );
  });

  it('redacta credenciales en el comando y la respuesta', () => {
    const p = nuevo();
    p.iniciar({
      comandoSanitizado: '/ppp secret add name=cliente password=NV-123',
      fecha: T1,
    });

    expect(p.toPrimitives().comandoSanitizado).toBe(
      '/ppp secret add name=cliente password=[REDACTED]',
    );
  });

  it('hydrate rechaza datos incoherentes con el estado', () => {
    const base = { ...nuevo().toPrimitives(), id: 1 };

    expect(PppoeOperacionPasoEntity.hydrate(base).id).toBe(1);
    expect(() =>
      PppoeOperacionPasoEntity.hydrate({
        ...base,
        estado: EstadoPasoPppoe.EXITOSO,
      }),
    ).toThrow(OperacionPppoeDatosInvalidosError);
    expect(() =>
      PppoeOperacionPasoEntity.hydrate({ ...base, errorCodigo: 'X' }),
    ).toThrow(OperacionPppoeDatosInvalidosError);
  });

  it('toPrimitives y los getters devuelven copias de las fechas', () => {
    const p = ejecutando();

    p.iniciadoEn!.setFullYear(2000);
    p.toPrimitives().creadoEn.setFullYear(2000);

    expect(p.iniciadoEn).toEqual(T1);
    expect(p.toPrimitives().creadoEn).toEqual(T0);
  });
});
