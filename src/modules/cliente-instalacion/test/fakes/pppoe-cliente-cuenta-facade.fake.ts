import { PppoeClienteCuentaFacadePort } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import {
  ClientePppoeCuentaReadModel,
  FlujoActivacionCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

type Activacion = {
  flujo: FlujoActivacionCuentaPppoe | null;
  instalacionId: number | null;
  habilitada: boolean;
  motivo: string | null;
};

/** Cuentas PPPoE en memoria por acceso; solo lo que usa cliente-instalacion. */
export class PppoeClienteCuentaFacadeFake
  implements Partial<PppoeClienteCuentaFacadePort>
{
  readonly cuentas = new Map<number, ClientePppoeCuentaReadModel>();
  activacion: Activacion = {
    flujo: FlujoActivacionCuentaPppoe.INSTALACION,
    instalacionId: null,
    habilitada: true,
    motivo: null,
  };

  /** Una cuenta mínima: solo los campos que lee cliente-instalacion. */
  sembrar(
    accesoInternetId: number,
    datos: { id?: number; tieneSecretCreado?: boolean } = {},
  ): ClientePppoeCuentaReadModel {
    const cuenta = {
      id: datos.id ?? 900 + accesoInternetId,
      empresaId: 1,
      accesoInternetId,
      tieneSecretCreado: datos.tieneSecretCreado ?? false,
    } as unknown as ClientePppoeCuentaReadModel;

    this.cuentas.set(accesoInternetId, cuenta);

    return cuenta;
  }

  buscarPorAccesoInternet(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    return Promise.resolve(this.cuentas.get(accesoInternetId) ?? null);
  }

  obtenerDetalle() {
    return Promise.resolve({
      acciones: { activar: this.activacion },
    } as unknown as Awaited<
      ReturnType<PppoeClienteCuentaFacadePort['obtenerDetalle']>
    >);
  }
}
