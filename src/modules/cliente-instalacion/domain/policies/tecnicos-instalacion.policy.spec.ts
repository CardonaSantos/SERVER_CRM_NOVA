import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';
import { ClienteInstalacionTecnicoInvalidoError } from '../errors/cliente-instalacion.errors';
import {
  normalizarTecnicosInstalacion,
  validarTecnicosActualizacion,
} from './tecnicos-instalacion.policy';

describe('validarTecnicosActualizacion', () => {
  const resp = (id: number) => ({
    tecnicoId: id,
    rol: RolTecnicoOperacionCliente.RESPONSABLE,
    esResponsable: true,
  });
  const apoyo = (id: number) => ({
    tecnicoId: id,
    rol: RolTecnicoOperacionCliente.APOYO,
    esResponsable: false,
  });

  it('acepta lista vacía y un responsable con apoyos', () => {
    expect(() => validarTecnicosActualizacion([])).not.toThrow();
    expect(() =>
      validarTecnicosActualizacion([resp(1), apoyo(2)]),
    ).not.toThrow();
  });

  it('rechaza repetidos, cero o dos responsables', () => {
    expect(() => validarTecnicosActualizacion([resp(1), apoyo(1)])).toThrow(
      'más de una vez',
    );
    expect(() => validarTecnicosActualizacion([apoyo(1)])).toThrow(
      'exactamente un técnico responsable',
    );
    expect(() => validarTecnicosActualizacion([resp(1), resp(2)])).toThrow(
      'exactamente un técnico responsable',
    );
  });

  it('rechaza rol y bandera incoherentes', () => {
    expect(() =>
      validarTecnicosActualizacion([
        {
          tecnicoId: 1,
          rol: RolTecnicoOperacionCliente.APOYO,
          esResponsable: true,
        },
      ]),
    ).toThrow('debe tener rol RESPONSABLE');
    expect(() =>
      validarTecnicosActualizacion([
        resp(1),
        {
          tecnicoId: 2,
          rol: RolTecnicoOperacionCliente.RESPONSABLE,
          esResponsable: false,
        },
      ]),
    ).toThrow('debe estar marcado como responsable');
  });
});

describe('normalizarTecnicosInstalacion', () => {
  it('sin técnicos devuelve lista vacía', () => {
    expect(normalizarTecnicosInstalacion([])).toEqual([]);
  });

  it('el rol por omisión es APOYO y las observaciones se recortan', () => {
    expect(
      normalizarTecnicosInstalacion([
        { tecnicoId: 1, observaciones: '  ayuda  ' },
        { tecnicoId: 2, observaciones: '   ' },
      ]),
    ).toEqual([
      {
        tecnicoId: 1,
        rol: RolTecnicoOperacionCliente.APOYO,
        esResponsable: false,
        observaciones: 'ayuda',
      },
      {
        tecnicoId: 2,
        rol: RolTecnicoOperacionCliente.APOYO,
        esResponsable: false,
        observaciones: null,
      },
    ]);
  });

  it('esResponsable o rol RESPONSABLE vuelven al técnico responsable', () => {
    const [porBandera, porRol] = normalizarTecnicosInstalacion([
      {
        tecnicoId: 1,
        esResponsable: true,
        rol: RolTecnicoOperacionCliente.OTRO,
      },
    ]).concat(
      normalizarTecnicosInstalacion([
        { tecnicoId: 2, rol: RolTecnicoOperacionCliente.RESPONSABLE },
      ]),
    );

    expect(porBandera).toMatchObject({
      esResponsable: true,
      rol: RolTecnicoOperacionCliente.RESPONSABLE,
    });
    expect(porRol).toMatchObject({ esResponsable: true });
  });

  it('rechaza un técnico repetido', () => {
    expect(() =>
      normalizarTecnicosInstalacion([{ tecnicoId: 1 }, { tecnicoId: 1 }]),
    ).toThrow(ClienteInstalacionTecnicoInvalidoError);
  });

  it('rechaza más de un responsable', () => {
    expect(() =>
      normalizarTecnicosInstalacion([
        { tecnicoId: 1, esResponsable: true },
        { tecnicoId: 2, rol: RolTecnicoOperacionCliente.RESPONSABLE },
      ]),
    ).toThrow('solo puede tener un técnico responsable');
  });
});
