import { UltimaUbicacionPresenter } from './ultima-ubicacion.presenter';

describe('UltimaUbicacionPresenter', () => {
  it('entrega la forma que pinta el mapa, sin campos de más', () => {
    const conCamposDeMas = {
      usuarioId: 7,
      latitud: 14.6,
      longitud: -90.5,
      precision: 5,
      velocidad: null,
      bateria: 70,
      actualizadoEn: new Date('2026-11-25T14:30:00.000Z'),
      usuario: {
        nombre: 'Técnico Uno',
        rol: 'TECNICO',
        telefono: null,
        avatarUrl: null,
        correo: 'no-debe-salir@example.com',
      },
      ticketsEnProceso: [{ id: 3, titulo: null, descripcion: 'interna' }],
    };

    expect(UltimaUbicacionPresenter.lista([conCamposDeMas])).toStrictEqual([
      {
        usuarioId: 7,
        latitud: 14.6,
        longitud: -90.5,
        precision: 5,
        velocidad: null,
        bateria: 70,
        actualizadoEn: '2026-11-25T14:30:00.000Z',
        usuario: {
          nombre: 'Técnico Uno',
          rol: 'TECNICO',
          telefono: null,
          avatarUrl: null,
        },
        ticketsEnProceso: [{ id: 3, titulo: null }],
      },
    ]);
  });
});
