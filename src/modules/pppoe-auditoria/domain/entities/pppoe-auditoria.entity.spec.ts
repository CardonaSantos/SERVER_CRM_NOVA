import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria.enum';

import { PppoeAuditoriaEntity } from './pppoe-auditoria.entity';

const FECHA = new Date('2026-11-24T18:00:00Z');

const base = {
  empresaId: 1,
  cuentaPppoeId: 10,
  operadorId: 7,
  origen: OrigenOperacionPppoe.OPERADOR,
  accion: AccionAuditoriaPppoe.HOJA_VISUALIZADA,
  descripcion: '  Credenciales visualizadas  ',
  creadoEn: FECHA,
};

describe('PppoeAuditoriaEntity', () => {
  it('crea un evento de cuenta normalizado, sin id y con la fecha recibida', () => {
    const e = PppoeAuditoriaEntity.registrarEventoCuenta(base);
    const p = e.toPrimitives();

    expect(p.id).toBeNull();
    expect(p.empresaId).toBe(1);
    expect(p.cuentaPppoeId).toBe(10);
    expect(p.descripcion).toBe('Credenciales visualizadas');
    expect(p.creadoEn.toISOString()).toBe(FECHA.toISOString());
  });

  it('un evento de operador exige operadorId; uno del sistema no', () => {
    expect(() =>
      PppoeAuditoriaEntity.create({ ...base, operadorId: null }),
    ).toThrow(/operadorId/);
    expect(() =>
      PppoeAuditoriaEntity.create({
        ...base,
        operadorId: null,
        origen: OrigenOperacionPppoe.SISTEMA,
      }),
    ).not.toThrow();
  });

  it('exige al menos un contexto de negocio', () => {
    expect(() =>
      PppoeAuditoriaEntity.create({
        ...base,
        cuentaPppoeId: null,
      }),
    ).toThrow(/al menos un contexto/);
  });

  it('rechaza ids no positivos y descripción vacía', () => {
    expect(() =>
      PppoeAuditoriaEntity.create({ ...base, empresaId: 0 }),
    ).toThrow(/empresaId/);
    expect(() =>
      PppoeAuditoriaEntity.create({ ...base, descripcion: '   ' }),
    ).toThrow(/obligatori/);
  });

  it('nunca guarda credenciales dentro de `datos`, aunque vengan anidadas o con tildes', () => {
    for (const datos of [
      { password: 'x' },
      { Contraseña: 'x' },
      { detalle: { secretoPlano: 'x' } },
      { access_token: 'x' },
    ]) {
      expect(() => PppoeAuditoriaEntity.create({ ...base, datos })).toThrow(
        /información sensible/,
      );
    }

    expect(() =>
      PppoeAuditoriaEntity.create({
        ...base,
        datos: {
          credencialesReveladas: true,
          origenConsulta: 'DETALLE_CUENTA',
        },
      }),
    ).not.toThrow();
  });

  it('una transición exige estados distintos', () => {
    const transicion = {
      ...base,
      accion: AccionAuditoriaPppoe.PREALTA_CREADA,
    };

    expect(() =>
      PppoeAuditoriaEntity.registrarTransicionCuenta({
        ...transicion,
        estadoCuentaAnterior: EstadoCuentaPppoe.ACTIVA,
        estadoCuentaNuevo: EstadoCuentaPppoe.ACTIVA,
      }),
    ).toThrow(/diferentes/);

    expect(
      PppoeAuditoriaEntity.registrarTransicionCuenta({
        ...transicion,
        estadoCuentaAnterior: null,
        estadoCuentaNuevo: EstadoCuentaPppoe.PENDIENTE_ACTIVACION,
      }).toPrimitives().estadoCuentaNuevo,
    ).toBe(EstadoCuentaPppoe.PENDIENTE_ACTIVACION);
  });

  it('hydrate reconstruye y toPrimitives devuelve copias de las fechas', () => {
    const original =
      PppoeAuditoriaEntity.registrarEventoCuenta(base).toPrimitives();
    const e = PppoeAuditoriaEntity.hydrate({ ...original, id: 5 });

    const fecha = e.creadoEn;
    fecha.setFullYear(2000);

    expect(e.toPrimitives().id).toBe(5);
    expect(e.creadoEn.toISOString()).toBe(FECHA.toISOString());
  });
});
