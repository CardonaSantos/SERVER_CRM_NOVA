import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { ClienteInstalacionAccesoInvalidoError } from '../errors/cliente-instalacion.errors';
import { esGponPppoe, validarAccesoNuevo } from './acceso-instalacion.policy';

const gponPppoe = {
  tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
  metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
};

describe('acceso-instalacion.policy', () => {
  it('solo FIBRA_GPON + PPPOE es GPON/PPPoE', () => {
    expect(
      esGponPppoe(gponPppoe.tecnologia, gponPppoe.metodoAutenticacion),
    ).toBe(true);
    expect(
      esGponPppoe(
        TecnologiaAccesoInternet.INALAMBRICO,
        MetodoAutenticacionInternet.PPPOE,
      ),
    ).toBe(false);
    expect(
      esGponPppoe(
        TecnologiaAccesoInternet.FIBRA_GPON,
        MetodoAutenticacionInternet.DHCP,
      ),
    ).toBe(false);
  });

  it('GPON/PPPoE exige servicio y router', () => {
    expect(() =>
      validarAccesoNuevo({
        ...gponPppoe,
        servicioInternetId: null,
        mikrotikRouterId: 5,
      }),
    ).toThrow('requiere un servicio de internet');
    expect(() =>
      validarAccesoNuevo({
        ...gponPppoe,
        servicioInternetId: 3,
        mikrotikRouterId: null,
      }),
    ).toThrow(ClienteInstalacionAccesoInvalidoError);
    expect(() =>
      validarAccesoNuevo({
        ...gponPppoe,
        servicioInternetId: 3,
        mikrotikRouterId: 5,
      }),
    ).not.toThrow();
  });

  it('otros accesos no exigen nada', () => {
    expect(() =>
      validarAccesoNuevo({
        tecnologia: TecnologiaAccesoInternet.INALAMBRICO,
        metodoAutenticacion: MetodoAutenticacionInternet.DHCP,
        servicioInternetId: null,
        mikrotikRouterId: null,
      }),
    ).not.toThrow();
  });
});
