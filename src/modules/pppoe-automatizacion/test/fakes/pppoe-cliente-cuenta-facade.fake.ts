import {
  CambiarEstadoCuentaPppoeInput,
  PppoeClienteCuentaFacadePort,
  RegistrarErrorCuentaPppoeInput,
  TransicionCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import {
  ClientePppoeCuentaReadModel,
  EstadoCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import { cuenta as construirCuenta } from './pppoe-read-models.fake';

const TRAS: Partial<Record<TransicionCuentaPppoe, EstadoCuentaPppoe>> = {
  MARCAR_SECRET_CREADO: EstadoCuentaPppoe.PENDIENTE_ACTIVACION,
  MARCAR_ACTIVA: EstadoCuentaPppoe.ACTIVA,
  MARCAR_SUSPENDIDA: EstadoCuentaPppoe.SUSPENDIDA,
  MARCAR_ELIMINADA: EstadoCuentaPppoe.ELIMINADA,
};

/** Fachada de cuentas en memoria con una sola cuenta (`cuenta`). */
export class PppoeClienteCuentaFacadeFake
  implements PppoeClienteCuentaFacadePort
{
  cuenta: ClientePppoeCuentaReadModel | null = null;
  readonly transiciones: TransicionCuentaPppoe[] = [];
  readonly errores: RegistrarErrorCuentaPppoeInput[] = [];

  buscarPorId(): Promise<ClientePppoeCuentaReadModel | null> {
    return Promise.resolve(this.cuenta);
  }

  cambiarEstado(
    input: CambiarEstadoCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    const estado = TRAS[input.transicion];
    if (!this.cuenta || !estado) throw new Error('Transición no simulada.');
    this.transiciones.push(input.transicion);
    this.cuenta = construirCuenta({
      ...this.cuenta,
      estado,
      secretCreadoEn:
        input.transicion === 'MARCAR_SECRET_CREADO'
          ? (input.fecha ?? null)
          : this.cuenta.secretCreadoEn,
    });
    return Promise.resolve(this.cuenta);
  }

  registrarError(
    input: RegistrarErrorCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    if (!this.cuenta) throw new Error('Sin cuenta en el fake.');
    this.errores.push(input);
    this.cuenta = construirCuenta({
      ...this.cuenta,
      ultimoError: input.mensaje,
    });
    return Promise.resolve(this.cuenta);
  }

  buscarPorAccesoInternet = noUsado;
  buscarVigentePorUsuario = noUsado;
  crear = noUsado;
  registrarAdoptada = noUsado;
  obtenerDetalle = noUsado;
  consultarCredencialesInstalacion = noUsado;
}

function noUsado(): never {
  throw new Error('Método de la fachada no usado en esta prueba.');
}
