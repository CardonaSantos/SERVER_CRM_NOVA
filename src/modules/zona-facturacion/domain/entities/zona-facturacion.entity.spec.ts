import { DATOS_ZONA } from '../../test/fakes/zona-facturacion-repository.fake';
import {
  ZonaFacturacionEliminadaError,
  ZonaFacturacionInvalidaError,
} from '../errors/zona-facturacion.errors';
import { ZonaFacturacionEntity } from './zona-facturacion.entity';

const AHORA = new Date('2026-11-26T18:00:00Z');
const DESPUES = new Date('2026-11-27T18:00:00Z');

describe('ZonaFacturacionEntity', () => {
  const nueva = () => ZonaFacturacionEntity.create(DATOS_ZONA, AHORA);

  it('nace activa, con el nombre recortado', () => {
    const zona = ZonaFacturacionEntity.create(
      {
        ...DATOS_ZONA,
        nombre: '  Zona norte  ',
        diaCorte: undefined,
        suspenderTrasFacturas: undefined,
      },
      AHORA,
    ).toPrimitives();

    expect(zona).toMatchObject({
      id: null,
      nombre: 'Zona norte',
      diaCorte: null,
      suspenderTrasFacturas: null,
      creadoEn: AHORA,
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  });

  it.each([
    ['nombre', '   '],
    ['diaGeneracionFactura', 0],
    ['diaPago', 32],
    ['diaRecordatorio', 1.5],
    ['diaSegundoRecordatorio', -1],
    ['diaCorte', 40],
    ['suspenderTrasFacturas', 13],
  ])('rechaza %s = %p', (campo, valor) => {
    expect(() =>
      ZonaFacturacionEntity.create({ ...DATOS_ZONA, [campo]: valor }, AHORA),
    ).toThrow(ZonaFacturacionInvalidaError);
    expect(() => nueva().configurar({ [campo]: valor }, DESPUES)).toThrow(
      ZonaFacturacionInvalidaError,
    );
  });

  it('acepta los días 29 a 31', () => {
    expect(() =>
      ZonaFacturacionEntity.create(
        { ...DATOS_ZONA, diaGeneracionFactura: 31, diaPago: 30 },
        AHORA,
      ),
    ).not.toThrow();
  });

  it('configurar solo cambia lo que llega; null quita el corte', () => {
    const zona = nueva();

    zona.configurar(
      { diaPago: 20, diaCorte: null, nombre: undefined },
      DESPUES,
    );

    expect(zona.toPrimitives()).toMatchObject({
      nombre: DATOS_ZONA.nombre,
      diaPago: 20,
      diaCorte: null,
      suspenderTrasFacturas: 2,
      actualizadoEn: DESPUES,
    });
  });

  it('un registro anterior fuera de rango se puede leer y editar', () => {
    const zona = ZonaFacturacionEntity.hydrate({
      ...nueva().toPrimitives(),
      id: 4,
      suspenderTrasFacturas: 40,
      diaRecordatorio: null,
    });

    zona.configurar({ nombre: 'Otra' }, DESPUES);

    expect(zona.toPrimitives()).toMatchObject({
      nombre: 'Otra',
      suspenderTrasFacturas: 40,
      diaRecordatorio: null,
    });
  });

  it('eliminar la marca y ya no admite cambios', () => {
    const zona = nueva();

    zona.eliminar(7, DESPUES);

    expect(zona.isEliminada).toBe(true);
    expect(zona.toPrimitives()).toMatchObject({
      eliminadoEn: DESPUES,
      eliminadoPorId: 7,
    });
    expect(() => zona.eliminar(7, DESPUES)).toThrow(
      ZonaFacturacionEliminadaError,
    );
    expect(() => zona.configurar({ diaPago: 2 }, DESPUES)).toThrow(
      ZonaFacturacionEliminadaError,
    );
  });
});
