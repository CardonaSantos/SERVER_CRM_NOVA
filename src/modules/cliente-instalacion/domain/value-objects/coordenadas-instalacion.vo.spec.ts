import { ClienteInstalacionDatosInvalidosError } from '../errors/cliente-instalacion.errors';
import { CoordenadasInstalacion } from './coordenadas-instalacion.vo';

describe('CoordenadasInstalacion', () => {
  it('lee "latitud, longitud"', () => {
    const c = CoordenadasInstalacion.desdeTexto(' 14.6349 , -90.5069 ');

    expect(c).toMatchObject({ latitud: 14.6349, longitud: -90.5069 });
  });

  it('vacío o ausente significa sin coordenadas', () => {
    expect(CoordenadasInstalacion.desdeTexto(undefined)).toBeNull();
    expect(CoordenadasInstalacion.desdeTexto(null)).toBeNull();
    expect(CoordenadasInstalacion.desdeTexto('   ')).toBeNull();
  });

  it.each([
    ['14.6', 'formato'],
    ['14.6, -90.5, 3', 'formato'],
    ['abc, def', 'no son válidas'],
    ['91, 0', 'latitud'],
    ['-91, 0', 'latitud'],
    ['0, 181', 'longitud'],
    ['0, -181', 'longitud'],
  ])('rechaza "%s"', (texto, fragmento) => {
    const error = (() => {
      try {
        CoordenadasInstalacion.desdeTexto(texto);
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(ClienteInstalacionDatosInvalidosError);
    expect((error as Error).message).toContain(fragmento);
  });

  it('acepta los extremos', () => {
    expect(CoordenadasInstalacion.desdeTexto('90, 180')).not.toBeNull();
    expect(CoordenadasInstalacion.desdeTexto('-90, -180')).not.toBeNull();
  });

  it('equals compara por valor', () => {
    const a = CoordenadasInstalacion.desdeTexto('1, 2')!;

    expect(a.equals(CoordenadasInstalacion.desdeTexto('1,2')!)).toBe(true);
    expect(a.equals(CoordenadasInstalacion.desdeTexto('1,3')!)).toBe(false);
  });
});
