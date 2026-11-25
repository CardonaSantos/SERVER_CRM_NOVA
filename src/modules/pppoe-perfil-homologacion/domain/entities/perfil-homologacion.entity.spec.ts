import { PerfilHomologacionDatosInvalidosError } from '../errors/pppoe-perfil-homologacion.errors';

import { PerfilHomologacionEntity } from './perfil-homologacion.entity';

const T0 = new Date('2026-11-24T16:00:00Z');
const T1 = new Date('2026-11-25T16:00:00Z');

const datos = {
  empresaId: 1,
  mikrotikRouterId: 4,
  servicioInternetId: 7,
  codigoPerfil: '  PLAN-20M  ',
  creadoPorId: 9,
};

const persistida = () =>
  PerfilHomologacionEntity.hydrate({
    ...PerfilHomologacionEntity.create(datos, T0).toPrimitives(),
    id: 1,
  });

describe('PerfilHomologacionEntity', () => {
  it('nace activa, con el código recortado y la fecha recibida', () => {
    const p = PerfilHomologacionEntity.create(datos, T0).toPrimitives();

    expect(p.id).toBeNull();
    expect(p.activo).toBe(true);
    expect(p.codigoPerfil).toBe('PLAN-20M');
    expect(p.creadoEn.toISOString()).toBe(T0.toISOString());
  });

  it('rechaza código vacío o largo e ids inválidos con error de dominio', () => {
    for (const malo of [
      { ...datos, codigoPerfil: '   ' },
      { ...datos, codigoPerfil: 'x'.repeat(101) },
      { ...datos, mikrotikRouterId: 0 },
      { ...datos, creadoPorId: -2 },
    ]) {
      expect(() => PerfilHomologacionEntity.create(malo, T0)).toThrow(
        PerfilHomologacionDatosInvalidosError,
      );
    }
  });

  it('actualizarCodigoPerfil registra autor y fecha; el mismo código no cambia nada', () => {
    const p = persistida();

    p.actualizarCodigoPerfil(' PLAN-20M ', 3, T1);
    expect(p.actualizadoPorId).toBeNull();

    p.actualizarCodigoPerfil('PLAN-25M', 3, T1);
    expect(p.codigoPerfil).toBe('PLAN-25M');
    expect(p.actualizadoPorId).toBe(3);
    expect(p.actualizadoEn.toISOString()).toBe(T1.toISOString());
  });

  it('activar y desactivar son idempotentes', () => {
    const p = persistida();

    p.activar(3, T1);
    expect(p.actualizadoPorId).toBeNull();

    p.desactivar(3, T1);
    expect(p.activo).toBe(false);
    p.desactivar(5, T0);
    expect(p.actualizadoPorId).toBe(3);

    p.activar(5, T1);
    expect(p.activo).toBe(true);
  });

  it('no se modifica una homologación sin persistir', () => {
    expect(() =>
      PerfilHomologacionEntity.create(datos, T0).desactivar(3, T1),
    ).toThrow(/persistirse/);
  });

  it('getters y toPrimitives devuelven copias de las fechas', () => {
    const p = persistida();

    p.creadoEn.setFullYear(2000);
    p.toPrimitives().actualizadoEn.setFullYear(2000);

    expect(p.creadoEn.toISOString()).toBe(T0.toISOString());
    expect(p.actualizadoEn.toISOString()).toBe(T0.toISOString());
  });
});
