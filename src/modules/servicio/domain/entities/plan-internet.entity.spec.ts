import { EstadoServicio } from '../enums/estado-servicio.enum';
import {
  PlanInternetEliminadoError,
  PlanInternetInvalidoError,
} from '../errors/servicio.errors';
import { PlanInternetEntity } from './plan-internet.entity';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const LUEGO = new Date('2026-11-27T18:00:00.000Z');

describe('PlanInternetEntity', () => {
  const crear = (cambios: { precio?: number; nombre?: string } = {}) =>
    PlanInternetEntity.create(
      { empresaId: 1, nombre: '  Plan hogar ', precio: 150, ...cambios },
      AHORA,
    );

  it('nace activo, con el texto recortado y sin velocidad', () => {
    expect(crear().toPrimitives()).toMatchObject({
      nombre: 'Plan hogar',
      velocidad: null,
      precio: 150,
      estado: EstadoServicio.ACTIVO,
      eliminadoEn: null,
    });
  });

  it('admite precio cero', () => {
    expect(crear({ precio: 0 }).precio).toBe(0);
  });

  it.each([-1, 10.005, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el precio %s',
    (precio) => {
      expect(() => crear({ precio })).toThrow(PlanInternetInvalidoError);
    },
  );

  it.each(['', '   ', 'x'.repeat(101)])('rechaza el nombre «%s»', (nombre) => {
    expect(() => crear({ nombre })).toThrow(PlanInternetInvalidoError);
  });

  it('lo que no llega no cambia y un cambio inválido no deja nada a medias', () => {
    const plan = crear();
    plan.actualizar({ velocidad: '30 Mbps' }, LUEGO);

    expect(() =>
      plan.actualizar({ nombre: '', velocidad: null }, LUEGO),
    ).toThrow(PlanInternetInvalidoError);
    expect(plan.toPrimitives()).toMatchObject({
      nombre: 'Plan hogar',
      velocidad: '30 Mbps',
      precio: 150,
      estado: EstadoServicio.ACTIVO,
      actualizadoEn: LUEGO,
    });
  });

  it('cambiar el precio avisa si no había nada que cambiar', () => {
    const plan = crear();

    expect(plan.cambiarPrecio(150, LUEGO)).toBe(false);
    expect(plan.toPrimitives().actualizadoEn).toEqual(AHORA);
    expect(plan.cambiarPrecio(175.5, LUEGO)).toBe(true);
    expect(plan.precio).toBe(175.5);
    expect(() => plan.cambiarPrecio(-5, LUEGO)).toThrow(
      PlanInternetInvalidoError,
    );
  });

  it('eliminado queda inactivo y ya no admite cambios', () => {
    const plan = crear();
    plan.eliminar(9, LUEGO);

    expect(plan.toPrimitives()).toMatchObject({
      estado: EstadoServicio.INACTIVO,
      eliminadoEn: LUEGO,
      eliminadoPorId: 9,
    });
    expect(() => plan.actualizar({ nombre: 'otro' }, LUEGO)).toThrow(
      PlanInternetEliminadoError,
    );
    expect(() => plan.cambiarPrecio(1, LUEGO)).toThrow(
      PlanInternetEliminadoError,
    );
    expect(() => plan.eliminar(9, LUEGO)).toThrow(PlanInternetEliminadoError);
  });

  it('carga filas antiguas sin imponerles las reglas de alta', () => {
    const plan = PlanInternetEntity.hydrate({
      ...crear().toPrimitives(),
      id: 1,
      nombre: '',
      precio: -10,
    });

    expect(plan.precio).toBe(-10);
  });
});
