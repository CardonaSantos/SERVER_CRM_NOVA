import { comprobacionesDe } from './coherencia-ubicacion.policy';

describe('comprobacionesDe', () => {
  const actual = { departamentoId: 1, municipioId: 10, sectorId: 5 };
  const nada = { departamento: false, municipio: false, sector: false };

  it('en un registro nuevo comprueba todo lo que llega', () => {
    expect(comprobacionesDe(actual)).toEqual({
      departamento: true,
      municipio: true,
      sector: true,
    });
    expect(
      comprobacionesDe({
        departamentoId: null,
        municipioId: null,
        sectorId: null,
      }),
    ).toEqual(nada);
  });

  it('sin cambios no comprueba nada, aunque la combinación no cuadre', () => {
    expect(comprobacionesDe(actual, actual)).toEqual(nada);
  });

  it('cambiar de municipio revisa el municipio y el sector', () => {
    expect(comprobacionesDe({ ...actual, municipioId: 11 }, actual)).toEqual({
      departamento: false,
      municipio: true,
      sector: true,
    });
  });

  it('cambiar de departamento revisa el departamento y el municipio', () => {
    expect(comprobacionesDe({ ...actual, departamentoId: 2 }, actual)).toEqual({
      departamento: true,
      municipio: true,
      sector: false,
    });
  });

  it('cambiar o quitar el sector solo revisa el sector', () => {
    expect(comprobacionesDe({ ...actual, sectorId: 6 }, actual)).toEqual({
      ...nada,
      sector: true,
    });
    expect(comprobacionesDe({ ...actual, sectorId: null }, actual)).toEqual(
      nada,
    );
  });
});
