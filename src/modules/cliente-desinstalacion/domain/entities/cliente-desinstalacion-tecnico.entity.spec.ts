import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { ClienteDesinstalacionDatosInvalidosError } from '../errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionTecnicoEntity } from './cliente-desinstalacion-tecnico.entity';

describe('ClienteDesinstalacionTecnicoEntity', () => {
  it('create: rol por omisión y observaciones normalizadas', () => {
    const e = ClienteDesinstalacionTecnicoEntity.create({
      desinstalacionId: 1,
      tecnicoId: 4,
      observaciones: '  ayuda ',
    });

    expect(e.toPrimitives()).toMatchObject({
      desinstalacionId: 1,
      tecnicoId: 4,
      esResponsable: false,
      observaciones: 'ayuda',
    });
    expect(e.toPrimitives().rol).toBeDefined();
  });

  it('pide un técnico o su nombre', () => {
    expect(() =>
      ClienteDesinstalacionTecnicoEntity.create({ desinstalacionId: 1 }),
    ).toThrow(ClienteDesinstalacionDatosInvalidosError);
    expect(() =>
      ClienteDesinstalacionTecnicoEntity.create({
        desinstalacionId: 1,
        tecnicoNombreSnapshot: 'Ana',
      }),
    ).not.toThrow();
  });

  it('valida el tiempo y los ids', () => {
    expect(() =>
      ClienteDesinstalacionTecnicoEntity.create({
        desinstalacionId: 1,
        tecnicoId: 4,
        tiempoMinutos: -1,
      }),
    ).toThrow('tiempoMinutos');
    expect(() =>
      ClienteDesinstalacionTecnicoEntity.create({
        desinstalacionId: 0,
        tecnicoId: 4,
        rol: RolTecnicoOperacionCliente.APOYO,
      }),
    ).toThrow(ClienteDesinstalacionDatosInvalidosError);
  });
});
