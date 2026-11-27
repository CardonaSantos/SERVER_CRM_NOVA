import {
  SectorEliminadoError,
  SectorInvalidoError,
} from '../errors/ubicacion.errors';
import { SectorEntity } from './sector.entity';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('SectorEntity', () => {
  const crear = (nombre = ' Centro ') =>
    SectorEntity.create({ nombre, descripcion: '  ', municipioId: 10 }, AHORA);

  it('nace vigente, con el texto recortado', () => {
    expect(crear().toPrimitives()).toMatchObject({
      nombre: 'Centro',
      descripcion: null,
      municipioId: 10,
      eliminadoEn: null,
    });
  });

  it.each(['', '  ', 'x'.repeat(101)])('rechaza el nombre «%s»', (nombre) => {
    expect(() => crear(nombre)).toThrow(SectorInvalidoError);
  });

  it('lo que no llega no cambia y un cambio inválido no deja nada a medias', () => {
    const sector = crear();
    sector.actualizar({ descripcion: 'Norte' }, AHORA);

    expect(() =>
      sector.actualizar({ nombre: '', municipioId: 11 }, AHORA),
    ).toThrow(SectorInvalidoError);
    expect(sector.toPrimitives()).toMatchObject({
      nombre: 'Centro',
      descripcion: 'Norte',
      municipioId: 10,
    });
  });

  it('eliminado ya no admite cambios', () => {
    const sector = crear();
    sector.eliminar(4, AHORA);

    expect(sector.toPrimitives()).toMatchObject({
      eliminadoEn: AHORA,
      eliminadoPorId: 4,
    });
    expect(() => sector.actualizar({}, AHORA)).toThrow(SectorEliminadoError);
    expect(() => sector.eliminar(4, AHORA)).toThrow(SectorEliminadoError);
  });

  it('carga filas antiguas sin imponerles las reglas de alta', () => {
    const sector = SectorEntity.hydrate({
      ...crear().toPrimitives(),
      id: 1,
      nombre: '',
    });

    expect(sector.nombre).toBe('');
  });
});
