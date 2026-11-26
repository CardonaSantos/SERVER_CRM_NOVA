import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { ClienteInstalacionAccesoInvalidoError } from '../errors/cliente-instalacion.errors';

/** Solo FIBRA_GPON con PPPOE tiene prealta automática de cuenta PPPoE. */
export function esGponPppoe(
  tecnologia: TecnologiaAccesoInternet,
  metodoAutenticacion: MetodoAutenticacionInternet,
): boolean {
  return (
    tecnologia === TecnologiaAccesoInternet.FIBRA_GPON &&
    metodoAutenticacion === MetodoAutenticacionInternet.PPPOE
  );
}

export type AccesoNuevoParaValidar = {
  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
  servicioInternetId: number | null;
  mikrotikRouterId: number | null;
};

/** Un acceso GPON + PPPoE necesita servicio y router para poder preparar su cuenta. */
export function validarAccesoNuevo(acceso: AccesoNuevoParaValidar): void {
  if (!esGponPppoe(acceso.tecnologia, acceso.metodoAutenticacion)) {
    return;
  }

  if (!acceso.servicioInternetId) {
    throw new ClienteInstalacionAccesoInvalidoError(
      'Un acceso GPON con PPPoE requiere un servicio de internet.',
    );
  }

  if (!acceso.mikrotikRouterId) {
    throw new ClienteInstalacionAccesoInvalidoError(
      'Un acceso GPON con PPPoE requiere un MikroTik.',
    );
  }
}
