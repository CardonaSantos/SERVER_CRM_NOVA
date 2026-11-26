import { AccionInstalacionAcceso } from '../enums/accion-instalacion-acceso.enum';
import { ClienteInstalacionDatosInvalidosError } from '../errors/cliente-instalacion.errors';
import { ClienteInstalacionAccesoEntity } from './cliente-instalacion-acceso.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('ClienteInstalacionAccesoEntity', () => {
  it('create usa la fecha recibida y nace sin id', () => {
    const e = ClienteInstalacionAccesoEntity.create(
      {
        instalacionId: 1,
        accesoInternetId: 2,
        accion: AccionInstalacionAcceso.CREADO,
      },
      AHORA,
    );

    expect(e.id).toBeNull();
    expect(e.creadoEn).toEqual(AHORA);
    expect(e.accion).toBe(AccionInstalacionAcceso.CREADO);
  });

  it('rechaza ids inválidos y acciones desconocidas', () => {
    expect(() =>
      ClienteInstalacionAccesoEntity.create(
        {
          instalacionId: 0,
          accesoInternetId: 2,
          accion: AccionInstalacionAcceso.CREADO,
        },
        AHORA,
      ),
    ).toThrow(ClienteInstalacionDatosInvalidosError);
    expect(() =>
      ClienteInstalacionAccesoEntity.create(
        {
          instalacionId: 1,
          accesoInternetId: 2,
          accion: 'X' as AccionInstalacionAcceso,
        },
        AHORA,
      ),
    ).toThrow('no es válida');
  });

  it('hydrate exige id y entrega copias de las fechas', () => {
    const e = ClienteInstalacionAccesoEntity.hydrate({
      id: 9,
      instalacionId: 1,
      accesoInternetId: 2,
      accion: AccionInstalacionAcceso.MODIFICADO,
      creadoEn: AHORA,
    });

    e.creadoEn.setFullYear(2000);

    expect(e.creadoEn).toEqual(AHORA);
    expect(() =>
      ClienteInstalacionAccesoEntity.hydrate({
        id: null,
        instalacionId: 1,
        accesoInternetId: 2,
        accion: AccionInstalacionAcceso.MODIFICADO,
        creadoEn: AHORA,
      }),
    ).toThrow(ClienteInstalacionDatosInvalidosError);
  });
});
