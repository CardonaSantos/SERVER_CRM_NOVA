import { TecnicoDesinstalacionConflictoError } from '../errors/cliente-desinstalacion.errors';
import {
  exigirSinResponsableActual,
  exigirUnSoloResponsable,
} from './tecnicos-desinstalacion.policy';

describe('tecnicos-desinstalacion.policy', () => {
  it('a lo sumo un responsable al crear', () => {
    expect(() => exigirUnSoloResponsable([])).not.toThrow();
    expect(() =>
      exigirUnSoloResponsable([
        { esResponsable: true },
        { esResponsable: false },
        {},
      ]),
    ).not.toThrow();
    expect(() =>
      exigirUnSoloResponsable([
        { esResponsable: true },
        { esResponsable: true },
      ]),
    ).toThrow(TecnicoDesinstalacionConflictoError);
  });

  it('no se asigna un segundo responsable', () => {
    expect(() =>
      exigirSinResponsableActual([{ esResponsable: false }]),
    ).not.toThrow();
    expect(() => exigirSinResponsableActual([{ esResponsable: true }])).toThrow(
      'ya tiene un técnico responsable',
    );
  });
});
