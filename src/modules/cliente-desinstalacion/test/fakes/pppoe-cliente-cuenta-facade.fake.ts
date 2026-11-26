import { PppoeClienteCuentaFacadePort } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { ClientePppoeCuentaReadModel } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

/** Cuentas PPPoE en memoria por acceso; solo lo que usa cliente-desinstalacion. */
export class PppoeClienteCuentaFacadeFake
  implements Partial<PppoeClienteCuentaFacadePort>
{
  readonly cuentas = new Map<number, ClientePppoeCuentaReadModel>();

  /** Una cuenta mínima: solo los campos que lee cliente-desinstalacion. */
  sembrar(accesoInternetId: number): ClientePppoeCuentaReadModel {
    const cuenta = {
      id: 900 + accesoInternetId,
      empresaId: 1,
      accesoInternetId,
    } as unknown as ClientePppoeCuentaReadModel;

    this.cuentas.set(accesoInternetId, cuenta);

    return cuenta;
  }

  buscarPorAccesoInternet(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    return Promise.resolve(this.cuentas.get(accesoInternetId) ?? null);
  }
}
